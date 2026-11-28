import { randomUUID } from "node:crypto";
import { queryD1 } from "../supporters-db.ts";
import { eventSlug, isEventSlug, parseDraft, publicProgramme, publishIssues, type EventDraft, type EventRecord, type Organisation, type PublicEvent } from "./model.ts";

import { organiserPredicate as eligible } from "./organiser-scope.ts";
import { LOCAL_SANCTION_POLICY } from "./sanction.ts";
import { publishedSanctions } from "./sanction-service.ts";

export async function eventStudioReady() {
  const [row] = await queryD1("SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('wpu_studio_events','wpu_studio_event_audit')");
  return row?.n===2;
}

export async function listOrganisations(account: string): Promise<Organisation[]> {
  return (await queryD1(`SELECT o.id,o.name FROM wpu_organisations o WHERE ${eligible("o.id")} ORDER BY o.name,o.id`,[account]))
    .map(row=>({id:String(row.id),name:String(row.name)}));
}

function toRecord(row: Record<string,unknown>): EventRecord {
  const draft = parseDraft(JSON.parse(String(row.draft_json)));
  if (!draft) throw new Error("Invalid stored event draft");
  return { id:String(row.id), organisation:{id:String(row.organisation_id),name:String(row.organiser)},
    slug:String(row.slug), revision:Number(row.revision), publishedRevision:row.published_revision===null ? null : Number(row.published_revision),
    draft, updatedAt:String(row.updated_at) };
}

const eventFields = `SELECT e.id,e.organisation_id,o.name AS organiser,e.slug,e.revision,
 e.draft_json,e.published_revision,e.updated_at FROM wpu_studio_events e
 JOIN wpu_organisations o ON o.id=e.organisation_id`;

export async function listEvents(account: string) {
  // Empty result is also the response for accounts which lost their scope.
  return (await queryD1(`${eventFields} WHERE ${eligible("e.organisation_id")}
    ORDER BY e.updated_at DESC,e.id LIMIT 100`,[account])).map(toRecord);
}

export async function getEvent(account: string, id: string) {
  const [row] = await queryD1(`${eventFields} WHERE e.id=? AND ${eligible("e.organisation_id")}`,[id,account]);
  return row ? toRecord(row) : null;
}

export async function createEvent(account: string, organisation: string, draft: EventDraft) {
  const id=randomUUID();
  const rows=await queryD1(`INSERT INTO wpu_studio_events(id,organisation_id,slug,draft_json,actor_account_id)
    SELECT ?,o.id,?,?,? FROM wpu_organisations o WHERE o.id=? AND ${eligible("o.id")}
    RETURNING id`,[id,eventSlug(draft.title,id),JSON.stringify(draft),account,organisation,account]);
  return rows.length ? getEvent(account,id) : null;
}

export async function changeEvent(account: string, id: string, revision: number, action: "save" | "publish" | "unpublish", draft?: EventDraft) {
  const current=await getEvent(account,id);
  if (!current) return { status:"missing" as const };
  if (current.revision!==revision) return { status:"stale" as const };
  if (action==="save" && !draft) return { status:"invalid" as const, issues:["Draft is missing."] };
  if (action==="publish") {
    const issues=publishIssues(current.draft);
    if (issues.length) return { status:"invalid" as const, issues };
    if (current.publishedRevision===current.revision) return { status:"ok" as const,event:current };
  }
  if (action==="unpublish" && current.publishedRevision===null) return { status:"ok" as const,event:current };
  const mutation=action==="save" ? "draft_json=?, revision=revision+1"
    : action==="publish" ? "published_json=?, published_revision=revision, published_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')"
    : "published_json=NULL, published_revision=NULL, published_at=NULL";
  const params=action==="save" ? [JSON.stringify(draft)] : action==="publish"
    ? [JSON.stringify({organiser:current.organisation.name,programme:publicProgramme(current.draft),sanctionPolicy:LOCAL_SANCTION_POLICY})] : [];
  // Revision protects concurrent edits, and the public version comparison protects
  // publish/unpublish races. Scope is checked in the write statement itself.
  const result=await queryD1(`UPDATE wpu_studio_events SET ${mutation}, actor_account_id=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id=? AND revision=? AND published_revision IS ? AND ${eligible("wpu_studio_events.organisation_id")} RETURNING id`,
    [...params,account,id,revision,current.publishedRevision,account]).catch((error:unknown)=>{
      if (error instanceof Error && error.message.includes("registration locks published division rules")) return null;
      throw error;
    });
  if (!result) return {status:"invalid" as const,issues:["Registration locks the published division, date and venue. An event with active entries cannot be taken offline."]};
  const event=await getEvent(account,id);
  if (!event) return { status:"missing" as const };
  return result.length ? {status:"ok" as const,event} : {status:"stale" as const};
}

export async function getPublicEvent(slug: string): Promise<PublicEvent | null> {
  if (!isEventSlug(slug)) return null;
  const [row]=await queryD1(`SELECT e.id,e.published_json FROM wpu_studio_events e
    JOIN wpu_organisations o ON o.id=e.organisation_id AND o.status='verified'
    WHERE e.slug=? AND e.published_json IS NOT NULL`,[slug]);
  if (!row) return null;
  const snapshot=JSON.parse(String(row.published_json));
  const programme=parseDraft(snapshot?.programme);
  if (!programme || typeof snapshot.organiser!=="string") return null;
  const tiers=programme.divisions.length ? await publishedSanctions(String(row.id),programme,snapshot.sanctionPolicy) : {};
  return { organiser:snapshot.organiser,programme:publicProgramme(programme),tiers };
}
