import { randomUUID } from "node:crypto";
import { queryD1 } from "../supporters-db.ts";
import { organiserPredicate } from "./organiser-scope.ts";
import { parseDraft, publishIssues, type EventDraft, type EventRecord } from "./model.ts";
import {
  canSanctionDivision, isHigherTier, LOCAL_SANCTION_POLICY, localTiers, readEvidence, sanctionBasis,
  type Evidence, type HigherTier, type SanctionRequest, type SanctionWorkspace, type StaffDecision, type TiersByDivision,
} from "./sanction.ts";

export async function sanctionReviewReady() {
  const [row]=await queryD1("SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='wpu_event_sanction_requests'");
  return row?.ok===1;
}

const basisMatch=(json:string)=>{
  const base=`json_array(
    json_extract(${json},'$.title'),json_extract(${json},'$.date'),json_extract(${json},'$.timezone'),json_extract(${json},'$.venue'),
    json_extract(d.value,'$.id'),json_extract(d.value,'$.kind'),json_extract(d.value,'$.name'),json_extract(d.value,'$.format'),
    json_extract(d.value,'$.capacity'),json_extract(d.value,'$.entry.mode'),json_extract(d.value,'$.entry.track'),
    json_extract(d.value,'$.entry.minimum'),json_extract(d.value,'$.entry.cutoffDate'))`;
  return `EXISTS(SELECT 1 FROM json_each(${json},'$.divisions') d
  WHERE json_extract(d.value,'$.id')=r.division_id
   AND NOT EXISTS(SELECT 1 FROM json_each(d.value,'$.startingScore.matchups') m WHERE json_extract(m.value,'$.ahead')<>'none')
   AND (CASE WHEN json_extract(d.value,'$.minimumAge') IS NULL THEN ${base}
        ELSE json_insert(${base},'$[#]',json_extract(d.value,'$.minimumAge')) END)=r.basis_json)`;
};
const asRequests=(draft:EventDraft)=>draft.divisions.filter(canSanctionDivision).map(d=>({divisionId:d.id,key:sanctionBasis(draft,d)}));

async function withApproved(eventId:string,draft:EventDraft,tiers:TiersByDivision) {
  if (!draft.divisions.length) return tiers;
  const rows=await queryD1(`SELECT r.division_id,min(r.requested_tier) AS tier FROM wpu_event_sanction_requests r
    JOIN json_each(?) b ON json_extract(b.value,'$.divisionId')=r.division_id AND json_extract(b.value,'$.key')=r.basis_json
    WHERE r.event_id=? AND r.status='approved' GROUP BY r.division_id`,[JSON.stringify(asRequests(draft)),eventId]);
  return {...tiers,...Object.fromEntries(rows.filter(r=>isHigherTier(r.tier)).map(r=>[r.division_id,r.tier]))} as TiersByDivision;
}

export async function publishedSanctions(eventId:string,draft:EventDraft,policy:unknown) {
  const base=policy===LOCAL_SANCTION_POLICY ? localTiers(draft) : {};
  // An older public snapshot remains unchanged until it is republished.
  return policy===LOCAL_SANCTION_POLICY && await sanctionReviewReady() ? withApproved(eventId,draft,base) : base;
}

export async function organiserSanctions(account:string,event:EventRecord):Promise<SanctionWorkspace> {
  const [row]=await queryD1(`SELECT e.published_json FROM wpu_studio_events e WHERE e.id=? AND ${organiserPredicate("e.organisation_id")}`,[event.id,account]);
  if (!row) return {live:{},preview:{},requests:[],available:false};
  const snapshot=row.published_json ? JSON.parse(String(row.published_json)) : null;
  const liveDraft=snapshot ? parseDraft(snapshot.programme) : null;
  const available=await sanctionReviewReady();
  const preview=publishIssues(event.draft).length ? {} : localTiers(event.draft);
  const live=liveDraft && snapshot.sanctionPolicy===LOCAL_SANCTION_POLICY ? localTiers(liveDraft) : {};
  if (!available) return {live,preview,requests:[],available};
  const choices=asRequests(event.draft);
  const [requests,liveTiers,previewTiers]=await Promise.all([
    queryD1(`SELECT r.id,r.division_id,r.requested_tier,r.status,r.created_at,r.decision_note,
       EXISTS(SELECT 1 FROM json_each(?) b WHERE json_extract(b.value,'$.divisionId')=r.division_id AND json_extract(b.value,'$.key')=r.basis_json) AS matches_draft
       FROM wpu_event_sanction_requests r JOIN wpu_studio_events e ON e.id=r.event_id
       WHERE r.event_id=? AND ${organiserPredicate("e.organisation_id")}
       ORDER BY matches_draft DESC,r.created_at DESC,r.id DESC LIMIT 256`,[JSON.stringify(choices),event.id,account]),
    liveDraft && snapshot.sanctionPolicy===LOCAL_SANCTION_POLICY ? withApproved(event.id,liveDraft,live) : live,
    publishIssues(event.draft).length ? preview : withApproved(event.id,event.draft,preview),
  ]);
  return {live:liveTiers,preview:previewTiers,available,requests:requests.map((r):SanctionRequest=>({
    id:String(r.id),divisionId:String(r.division_id),tier:r.requested_tier as HigherTier,status:r.status as SanctionRequest["status"],
    matchesDraft:r.matches_draft===1,note:String(r.decision_note??""),createdAt:String(r.created_at),
  }))};
}

export async function submitSanctions(account:string,event:EventRecord,ids:string[],tier:HigherTier,evidence:Evidence) {
  if (publishIssues(event.draft).length) return "incomplete";
  if (event.draft.divisions.some(d=>ids.includes(d.id)&&!canSanctionDivision(d))) return "participation";
  const choices=asRequests(event.draft).filter(d=>ids.includes(d.divisionId)).map(d=>({...d,id:randomUUID()}));
  if (!ids.length || choices.length!==ids.length || !isHigherTier(tier) || !readEvidence(evidence)) return "incomplete";
  const data=JSON.stringify(choices);
  // Insertion is atomic for the selected divisions, protects against concurrent
  // edits, and reads the active organiser grant in the actual write statement.
  const rows=await queryD1(`WITH selected AS (
    SELECT json_extract(value,'$.id') AS id,json_extract(value,'$.divisionId') AS division_id,json_extract(value,'$.key') AS basis
      FROM json_each(?))
    INSERT INTO wpu_event_sanction_requests(id,event_id,division_id,requested_tier,basis_json,evidence_json,submitted_by)
    SELECT s.id,e.id,s.division_id,?,s.basis,?,?
      FROM wpu_studio_events e CROSS JOIN selected s
      WHERE e.id=? AND e.revision=? AND ${organiserPredicate("e.organisation_id")}
        AND NOT EXISTS(SELECT 1 FROM wpu_event_sanction_requests r JOIN selected b ON b.division_id=r.division_id AND b.basis=r.basis_json
          WHERE r.event_id=e.id AND (r.status='pending' OR (r.status='approved' AND r.requested_tier<=?)))
    RETURNING id`,[data,tier,JSON.stringify(evidence),account,event.id,event.revision,account,tier]);
  return rows.length===choices.length ? "ok" : "conflict";
}

type Reviewer={account:string;email:string};
const networkReviewer=`EXISTS(SELECT 1 FROM wpu_accounts a JOIN wpu_auth_emails m ON m.account_id=a.id
  WHERE a.id=? AND a.status='active' AND m.email_normalized=? AND m.verified_at IS NOT NULL AND (
    EXISTS(SELECT 1 FROM wpu_role_assignments g WHERE g.account_id=a.id AND g.role='wpu_admin' AND g.scope_type='global' AND g.revoked_at IS NULL)
    OR (
      EXISTS(SELECT 1 FROM wpu_organisation_intake_reviewers g WHERE g.account_id=a.id AND g.revoked_at IS NULL)
      AND EXISTS(SELECT 1 FROM wpu_federation_publishers g WHERE g.account_id=a.id AND g.revoked_at IS NULL)
    )))`;

export async function canReviewSanctions(reviewer:Reviewer) {
  if (!await sanctionReviewReady()) return false;
  const [row]=await queryD1(`SELECT 1 AS allowed WHERE ${networkReviewer}`,[reviewer.account,reviewer.email]);
  return row?.allowed===1;
}

export async function sanctionQueue(reviewer:Reviewer,history:boolean,offset:number) {
  const rows=await queryD1(`SELECT r.id,r.requested_tier,r.status,r.evidence_json,r.basis_json,r.created_at,r.decision_note,
      o.name AS organisation,e.slug,e.published_revision,${basisMatch("e.draft_json")} AND o.status='verified' AS current_plan
    FROM wpu_event_sanction_requests r JOIN wpu_studio_events e ON e.id=r.event_id JOIN wpu_organisations o ON o.id=e.organisation_id
    WHERE (r.status='pending')=? AND ${networkReviewer}
    ORDER BY r.created_at ${history?"DESC":"ASC"},r.id LIMIT 21 OFFSET ?`,[history?0:1,reviewer.account,reviewer.email,offset]);
  return {hasMore:rows.length>20,items:rows.slice(0,20).map(r=>{
    const [title,date,timezone,venue,,kind,division,format,capacity,mode,track,minimum,cutoff,minimumAge]=JSON.parse(String(r.basis_json));
    return {id:String(r.id),tier:r.requested_tier as HigherTier,status:r.status as SanctionRequest["status"],evidence:JSON.parse(String(r.evidence_json)) as Evidence,
      title:String(title),date:String(date),timezone:String(timezone),venue:String(venue),kind:String(kind),division:String(division),
      format:String(format),capacity:Number(capacity),mode:String(mode),track:track===null?null:String(track),
      minimum:minimum===null?null:Number(minimum),cutoff:cutoff===null?null:String(cutoff),minimumAge:typeof minimumAge==="number"?minimumAge:null,organisation:String(r.organisation),
      current:r.current_plan===1,note:String(r.decision_note??""),createdAt:String(r.created_at),
      publicSlug:r.published_revision===null?null:String(r.slug)};
  })};
}
export type SanctionQueueItem=Awaited<ReturnType<typeof sanctionQueue>>["items"][number];

export async function decideSanction(reviewer:Reviewer,id:string,decision:StaffDecision,note:string) {
  if ((decision!=="approved" && decision!=="changes_requested") || note.length>500 || (decision==="changes_requested" && !note.trim())) return false;
  const result=await queryD1(`UPDATE wpu_event_sanction_requests AS r
    SET status=?,decided_by=?,decided_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),decision_note=?
    WHERE r.id=? AND r.status='pending' AND ${networkReviewer}
    AND (?='changes_requested' OR EXISTS(SELECT 1 FROM wpu_studio_events e JOIN wpu_organisations o
      ON o.id=e.organisation_id AND o.status='verified' WHERE e.id=r.event_id AND ${basisMatch("e.draft_json")}))
    RETURNING id`,[decision,reviewer.account,note,id,reviewer.account,reviewer.email,decision]);
  return result.length===1;
}
