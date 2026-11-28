import { randomBytes, randomUUID } from "node:crypto";
import { queryD1 } from "../supporters-db.ts";
import { organiserPredicate } from "../events/organiser-scope.ts";
import { parseDraft } from "../events/model.ts";
import {
  canJoinKind, canRegisterDivision, parseRegistrationSetup, validBirthDate, type Currency, type EntryPlayer, type EntryStatus,
  type EntryView, type PilotKind, type Registration, type RegistrationInput, type RegistrationSetup, type SavedRegistrationSetup,
} from "./model.ts";

const now=()=>Math.floor(Date.now()/1000);
export const HOLD_SECONDS=20*60;
const active="status NOT IN ('withdrawn','expired')";
const seatRoom=(r:string)=>`(SELECT count(*) FROM wpu_event_entries t WHERE t.event_id=${r}.event_id AND t.division_id=${r}.division_id AND t.reserved=1)<${r}.capacity`;
const noWaiting=(r:string)=>`NOT EXISTS(SELECT 1 FROM wpu_event_entries t WHERE t.event_id=${r}.event_id AND t.division_id=${r}.division_id AND t.status='waitlisted')`;

export async function entriesReady() {
  const [row]=await queryD1("SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('wpu_event_registration','wpu_event_entries')");
  return row?.n===2;
}
export async function registrationSetupReady() {
  const [row]=await queryD1("SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='wpu_event_registration_setup'");
  return row?.ok===1;
}
function toSetup(row:Record<string,unknown>):SavedRegistrationSetup {
  const settings=parseRegistrationSetup(JSON.parse(String(row.setup_json)));
  if(!settings)throw new Error("Invalid registration setup");
  return {divisionId:String(row.division_id),revision:Number(row.revision),settings};
}
export async function organiserRegistrationSetup(account:string,eventId:string) {
  const rows=await queryD1(`SELECT s.division_id,s.revision,s.setup_json FROM wpu_event_registration_setup s
    JOIN wpu_studio_events e ON e.id=s.event_id WHERE e.id=? AND ${organiserPredicate("e.organisation_id")}`,[eventId,account]);
  return rows.map(toSetup);
}
export async function saveRegistrationSetup(account:string,eventId:string,eventRevision:number,divisionId:string,expected:number,settings:RegistrationSetup) {
  const rows=await queryD1(`INSERT INTO wpu_event_registration_setup(event_id,division_id,setup_json)
    SELECT e.id,?,? FROM wpu_studio_events e WHERE e.id=? AND e.revision=? AND ${organiserPredicate("e.organisation_id")}
    AND EXISTS (SELECT 1 FROM json_each(e.draft_json,'$.divisions') d WHERE json_extract(d.value,'$.id')=?)
    AND NOT EXISTS(SELECT 1 FROM wpu_event_registration r WHERE r.event_id=e.id AND r.division_id=?)
    AND (?=0 OR EXISTS(SELECT 1 FROM wpu_event_registration_setup s WHERE s.event_id=e.id AND s.division_id=?))
    ON CONFLICT(event_id,division_id) DO UPDATE SET setup_json=excluded.setup_json,revision=wpu_event_registration_setup.revision+1
    WHERE wpu_event_registration_setup.revision=? RETURNING division_id,revision,setup_json`,
    [divisionId,JSON.stringify(settings),eventId,eventRevision,account,divisionId,divisionId,expected,divisionId,expected]);
  return rows[0]?toSetup(rows[0]):null;
}
export async function entryPlayer(account:string):Promise<EntryPlayer|null> {
  const [r]=await queryD1(`SELECT p.id,p.display_name,p.birth_date,p.gender FROM wpu_accounts a
    JOIN wpu_persons p ON p.id=a.person_id JOIN wpu_player_profiles q ON q.person_id=p.id
    WHERE a.id=? AND a.status='active' AND EXISTS(SELECT 1 FROM wpu_auth_emails m WHERE m.account_id=a.id AND m.verified_at IS NOT NULL)`,[account]);
  return r?{id:String(r.id),name:String(r.display_name),hasBirthDate:validBirthDate(r.birth_date),
    gender:r.gender==="male"||r.gender==="female"?r.gender:null}:null;
}
export async function saveBirthDate(account:string,value:string) {
  if (!validBirthDate(value)) return false;
  await queryD1(`UPDATE wpu_persons AS p SET birth_date=?,updated_at=datetime('now') WHERE p.birth_date IS NULL
    AND EXISTS(SELECT 1 FROM wpu_accounts a WHERE a.id=? AND a.person_id=p.id AND a.status='active'
      AND EXISTS(SELECT 1 FROM wpu_auth_emails m WHERE m.account_id=a.id AND m.verified_at IS NOT NULL))`,[value,account]);
  return (await entryPlayer(account))?.hasBirthDate===true;
}
export async function openRegistration(account:string,eventId:string,divisionId:string,input:RegistrationInput,paidHost:string|null,setupRevision?:number) {
  const [event]=await queryD1(`SELECT e.published_json,e.published_revision,e.organisation_id FROM wpu_studio_events e
    WHERE e.id=? AND e.published_json IS NOT NULL AND ${organiserPredicate("e.organisation_id")}`,[eventId,account]);
  if (!event) return "missing";
  if (input.amount && paidHost!==event.organisation_id) return "payments";
  const snapshot=JSON.parse(String(event.published_json));
  if(snapshot.sanctionPolicy!==1)return "unsupported";
  const draft=parseDraft(snapshot.programme);
  const division=draft?.divisions.find(d=>d.id===divisionId);
  if (!draft||!division||!canRegisterDivision(division)||!division.capacity) return "unsupported";
  const closeDate=new Intl.DateTimeFormat("sv-SE",{timeZone:draft.timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(input.closesAt*1000));
  if (closeDate>draft.date||input.closesAt<=now()) return "closing";
  const rows=await queryD1(`INSERT INTO wpu_event_registration(event_id,division_id,division_name,kind,capacity,closes_at,fee_minor,currency,terms,contact,division_json,event_date,venue,time_zone)
    SELECT e.id,?,?,?,?,?,?,?,?,?,json(d.value),json_extract(e.published_json,'$.programme.date'),json_extract(e.published_json,'$.programme.venue'),json_extract(e.published_json,'$.programme.timezone')
    FROM wpu_studio_events e JOIN json_each(e.published_json,'$.programme.divisions') d ON json_extract(d.value,'$.id')=?
    WHERE e.id=? AND e.published_revision=? AND e.published_json IS NOT NULL
    AND ${organiserPredicate("e.organisation_id")}
    ${setupRevision===undefined?"":`AND e.revision=e.published_revision AND EXISTS (SELECT 1 FROM wpu_event_registration_setup s
      WHERE s.event_id=e.id AND s.division_id=? AND s.revision=?)`}
    ON CONFLICT(event_id,division_id) DO NOTHING RETURNING division_id`,
    [divisionId,division.name,division.kind,division.capacity,input.closesAt,input.amount,input.currency,input.terms,input.contact,divisionId,eventId,event.published_revision,account,
      ...(setupRevision===undefined?[]:[divisionId,setupRevision])]);
  return rows.length?"ok":"conflict";
}
export async function setRegistrationPaused(account:string,eventId:string,divisionId:string,paused:boolean) {
  const rows=await queryD1(`UPDATE wpu_event_registration AS r SET paused=? WHERE r.event_id=? AND r.division_id=? AND
    EXISTS(SELECT 1 FROM wpu_studio_events e WHERE e.id=r.event_id AND e.published_json IS NOT NULL AND ${organiserPredicate("e.organisation_id")}) RETURNING division_id`,
    [paused?1:0,eventId,divisionId,account]);
  return rows.length===1;
}
export async function resetUnusedRegistration(account:string,eventId:string,divisionId:string) {
  const rows=await queryD1(`DELETE FROM wpu_event_registration AS r WHERE r.event_id=? AND r.division_id=?
    AND (r.paused=1 OR r.closes_at<=?) AND NOT EXISTS(SELECT 1 FROM wpu_event_entries t WHERE t.event_id=r.event_id AND t.division_id=r.division_id)
    AND EXISTS(SELECT 1 FROM wpu_studio_events e WHERE e.id=r.event_id AND ${organiserPredicate("e.organisation_id")}) RETURNING division_id`,
    [eventId,divisionId,now(),account]);
  return rows.length===1;
}
function registration(r:Record<string,unknown>):Registration {
  return {divisionId:String(r.division_id),name:String(r.division_name),kind:r.kind as PilotKind,capacity:Number(r.capacity),closesAt:Number(r.closes_at),
    terms:String(r.terms),contact:String(r.contact),accepting:r.paused===0&&Number(r.closes_at)>now(),ended:Number(r.closes_at)<=now(),
    fee:{amount:Number(r.fee_minor),currency:r.currency as Currency}};
}
export async function publicRegistration(slug:string) {
  const rows=await queryD1(`SELECT r.* FROM wpu_event_registration r JOIN wpu_studio_events e ON e.id=r.event_id
    JOIN wpu_organisations o ON o.id=e.organisation_id AND o.status='verified' WHERE e.slug=? AND e.published_json IS NOT NULL`,[slug]);
  return rows.map(registration);
}
export async function organiserRegistrations(account:string,eventId:string) {
  const rows=await queryD1(`SELECT r.*,t.status,count(t.id) AS n
    FROM wpu_event_registration r JOIN wpu_studio_events e ON e.id=r.event_id
    LEFT JOIN wpu_event_entries t ON t.event_id=r.event_id AND t.division_id=r.division_id
      AND (t.hold_until IS NULL OR t.hold_until>?)
    WHERE r.event_id=? AND ${organiserPredicate("e.organisation_id")}
    GROUP BY r.division_id,t.status`,[now(),eventId,account]);
  const result=new Map<string,Registration>();
  for (const row of rows) {
    const id=String(row.division_id);
    const view=result.get(id)??{...registration(row),counts:{}};
    if(typeof row.status==="string") view.counts![row.status as EntryStatus]=Number(row.n);
    result.set(id,view);
  }
  return [...result.values()];
}
export async function organiserEntryList(account:string,eventId:string,divisionId:string,offset:number) {
  const [scope]=await queryD1(`SELECT 1 AS ok FROM wpu_studio_events e WHERE e.id=? AND ${organiserPredicate("e.organisation_id")}`,[eventId,account]);
  if(!scope)return {more:false,items:[]};
  await reconcile(eventId,divisionId);
  const rows=await queryD1(`SELECT t.id,t.status,t.hold_until,l.display_name AS lead,p.display_name AS partner
    FROM wpu_event_entries t JOIN wpu_studio_events e ON e.id=t.event_id
    JOIN wpu_persons l ON l.id=t.lead_id LEFT JOIN wpu_persons p ON p.id=t.partner_id
    WHERE t.event_id=? AND t.division_id=? AND t.${active} AND ${organiserPredicate("e.organisation_id")}
    ORDER BY CASE t.status WHEN 'confirmed' THEN 0 WHEN 'waitlisted' THEN 2 ELSE 1 END,coalesce(t.queued_at,t.created_at),t.id LIMIT 51 OFFSET ?`,[eventId,divisionId,account,offset]);
  return {more:rows.length>50,items:rows.slice(0,50).map(r=>({id:String(r.id),status:r.status as EntryStatus,lead:String(r.lead),
    partner:typeof r.partner==="string"?r.partner:null,holdUntil:r.hold_until===null?null:Number(r.hold_until)}))};
}
export async function registrationFor(slug:string,divisionId:string) {
  const [row]=await queryD1(`SELECT r.*,e.slug,e.organisation_id,json_extract(e.published_json,'$.programme.timezone') AS event_zone FROM wpu_event_registration r JOIN wpu_studio_events e ON e.id=r.event_id
    JOIN wpu_organisations o ON o.id=e.organisation_id AND o.status='verified'
    WHERE e.slug=? AND r.division_id=? AND e.published_json IS NOT NULL`,[slug,divisionId]);
  return row?{...registration(row),eventId:String(row.event_id),hostId:String(row.organisation_id),slug:String(row.slug),timeZone:String(row.event_zone??"UTC")}:null;
}
type RegisterContext=NonNullable<Awaited<ReturnType<typeof registrationFor>>>;

async function reconcile(eventId:string,divisionId:string) {
  const time=now();
  await queryD1(`UPDATE wpu_event_entries SET status='expired',reserved=0,hold_until=NULL
    WHERE event_id=? AND division_id=? AND status IN ('invited','offered','ready') AND hold_until<=?`,[eventId,divisionId,time]);
  // Allocate open places in queue order. Confirmed or provider-pending seats are never reclaimed by this clock.
  await queryD1(`UPDATE wpu_event_entries SET status='offered',reserved=1,hold_until=?
    WHERE status='waitlisted' AND id IN (
      SELECT t.id FROM wpu_event_entries t JOIN wpu_event_registration r ON r.event_id=t.event_id AND r.division_id=t.division_id
      WHERE t.event_id=? AND t.division_id=? AND t.status='waitlisted' AND r.paused=0 AND r.closes_at>?
      ORDER BY t.queued_at,t.id
      LIMIT (SELECT max(0,r.capacity-(SELECT count(*) FROM wpu_event_entries q
        WHERE q.event_id=r.event_id AND q.division_id=r.division_id AND q.reserved=1))
        FROM wpu_event_registration r WHERE r.event_id=? AND r.division_id=?)
    )`,[time+HOLD_SECONDS,eventId,divisionId,time,eventId,divisionId]);
}

const viewEntry=(r:Record<string,unknown>,playerId:string):EntryView=>{
  const lead=r.lead_id===playerId;
  return {id:String(r.id),status:r.status as EntryStatus,divisionId:String(r.division_id),name:String(r.division_name),
    eventSlug:String(r.slug),eventTitle:String(r.event_title??"WPU tournament"),kind:r.kind as PilotKind,holdUntil:r.hold_until===null?null:Number(r.hold_until),
    seatHeld:r.reserved===1,role:lead?"lead":"partner",...(lead&&r.status==="invited"?{invite:String(r.invite)}:{}),
    fee:{amount:Number(r.fee_minor),currency:r.currency as Currency},terms:String(r.terms),contact:String(r.contact),
    canPay:r.status==="ready"||r.status==="paying"&&r.payer_id===playerId};
};
const entryFields=`t.*,r.kind,r.division_name,r.fee_minor,r.currency,r.terms,r.contact,e.slug,e.organisation_id,json_extract(e.published_json,'$.programme.title') AS event_title`;
const entryJoin=`FROM wpu_event_entries t JOIN wpu_event_registration r ON r.event_id=t.event_id AND r.division_id=t.division_id
  JOIN wpu_studio_events e ON e.id=t.event_id`;
export async function entryFor(context:RegisterContext,playerId:string) {
  await reconcile(context.eventId,context.divisionId);
  const [r]=await queryD1(`SELECT ${entryFields} ${entryJoin} WHERE t.event_id=? AND t.division_id=? AND (t.lead_id=? OR t.partner_id=?)
    ORDER BY CASE WHEN t.${active} THEN 0 ELSE 1 END,t.created_at DESC,t.rowid DESC LIMIT 1`,[context.eventId,context.divisionId,playerId,playerId]);
  return r?viewEntry(r,playerId):null;
}
export async function playerEntries(playerId:string) {
  await queryD1(`UPDATE wpu_event_entries SET status='expired',reserved=0,hold_until=NULL
    WHERE (lead_id=? OR partner_id=?) AND status IN ('invited','offered','ready') AND hold_until<=?`,[playerId,playerId,now()]);
  const rows=await queryD1(`SELECT ${entryFields} ${entryJoin} WHERE t.lead_id=? OR t.partner_id=? ORDER BY t.created_at DESC,t.rowid DESC LIMIT 60`,[playerId,playerId]);
  return rows.map(r=>viewEntry(r,playerId));
}
export async function invitation(context:RegisterContext,code:string) {
  await reconcile(context.eventId,context.divisionId);
  const [r]=await queryD1(`SELECT p.display_name FROM wpu_event_entries t JOIN wpu_persons p ON p.id=t.lead_id
    WHERE t.event_id=? AND t.division_id=? AND t.invite=? AND t.status='invited' AND t.hold_until>?`,[context.eventId,context.divisionId,code,now()]);
  return typeof r?.display_name==="string"?r.display_name:null;
}
export async function startEntry(context:RegisterContext,player:EntryPlayer) {
  if(!canJoinKind(context.kind,player))return "ineligible";
  await reconcile(context.eventId,context.divisionId);
  const time=now(),id=randomUUID(),invite=context.kind==="singles"?null:randomBytes(24).toString("hex");
  const rows=await queryD1(`WITH choice AS (
    SELECT r.event_id,r.division_id,r.kind,r.fee_minor,(${seatRoom("r")} AND ${noWaiting("r")}) AS room
      FROM wpu_event_registration r JOIN wpu_studio_events e ON e.id=r.event_id
      JOIN wpu_organisations o ON o.id=e.organisation_id AND o.status='verified'
      WHERE r.event_id=? AND r.division_id=? AND r.paused=0 AND r.closes_at>? AND e.published_json IS NOT NULL
  )
  INSERT INTO wpu_event_entries(id,event_id,division_id,lead_id,invite,status,reserved,hold_until,created_at,queued_at)
    SELECT ?,event_id,division_id,?,?,
      CASE WHEN kind<>'singles' THEN 'invited' WHEN NOT room THEN 'waitlisted' WHEN fee_minor=0 THEN 'confirmed' ELSE 'ready' END,
      room,CASE WHEN kind<>'singles' OR (room AND fee_minor>0) THEN ? END,?,
      CASE WHEN kind='singles' AND NOT room THEN ? END
      FROM choice r WHERE NOT EXISTS(SELECT 1 FROM wpu_event_entries t WHERE t.event_id=r.event_id AND t.division_id=r.division_id AND t.${active}
        AND (t.lead_id=? OR t.partner_id=?))
    RETURNING id`,[context.eventId,context.divisionId,time,id,player.id,invite,time+HOLD_SECONDS,time,time,player.id,player.id]);
  return rows.length?"ok":"unavailable";
}
export async function acceptEntry(context:RegisterContext,player:EntryPlayer,code:string) {
  await reconcile(context.eventId,context.divisionId);
  const time=now();
  const [lead]=await queryD1(`SELECT l.gender,t.lead_id FROM wpu_event_entries t JOIN wpu_persons l ON l.id=t.lead_id
    WHERE t.event_id=? AND t.division_id=? AND t.invite=? AND t.status='invited' AND t.hold_until>?`,[context.eventId,context.divisionId,code,time]);
  if (!lead||lead.lead_id===player.id) return "unavailable";
  if(!canJoinKind(context.kind,player,(lead.gender??null) as EntryPlayer["gender"]))return "ineligible";
  const rows=await queryD1(`WITH choice AS (
    SELECT t.id,r.fee_minor,(t.reserved=1 OR (${seatRoom("r")} AND ${noWaiting("r")})) AS room
    FROM wpu_event_entries t JOIN wpu_event_registration r ON r.event_id=t.event_id AND r.division_id=t.division_id
    WHERE t.event_id=? AND t.division_id=? AND t.invite=? AND t.status='invited' AND t.hold_until>? AND r.paused=0 AND r.closes_at>?
      AND t.lead_id<>? AND NOT EXISTS(SELECT 1 FROM wpu_event_entries a WHERE a.event_id=t.event_id AND a.division_id=t.division_id
        AND a.${active} AND (a.lead_id=? OR a.partner_id=?))
      AND EXISTS(SELECT 1 FROM wpu_persons l JOIN wpu_persons p ON p.id=? WHERE l.id=t.lead_id
        AND l.birth_date IS NOT NULL AND p.birth_date IS NOT NULL
        AND (r.kind='doubles' OR r.kind='mens-doubles' AND l.gender='male' AND p.gender='male'
          OR r.kind='womens-doubles' AND l.gender='female' AND p.gender='female' OR r.kind='mixed' AND l.gender<>p.gender))
  )
  UPDATE wpu_event_entries SET partner_id=?,invite=NULL,reserved=choice.room,
    status=CASE WHEN NOT choice.room THEN 'waitlisted' WHEN choice.fee_minor=0 THEN 'confirmed' ELSE 'ready' END,
    hold_until=CASE WHEN choice.room AND choice.fee_minor>0 THEN ? END,queued_at=CASE WHEN NOT choice.room THEN ? END
  FROM choice WHERE wpu_event_entries.id=choice.id AND wpu_event_entries.status='invited' RETURNING id`,
  [context.eventId,context.divisionId,code,time,time,player.id,player.id,player.id,player.id,player.id,time+HOLD_SECONDS,time]);
  return rows.length?"ok":"unavailable";
}
export async function claimOffer(context:RegisterContext,playerId:string,id:string) {
  await reconcile(context.eventId,context.divisionId);
  const time=now();
  const rows=await queryD1(`UPDATE wpu_event_entries SET status=?,hold_until=?
    WHERE id=? AND event_id=? AND division_id=? AND status='offered' AND hold_until>? AND (lead_id=? OR partner_id=?) RETURNING id`,
    [context.fee.amount?"ready":"confirmed",context.fee.amount?time+HOLD_SECONDS:null,id,context.eventId,context.divisionId,time,playerId,playerId]);
  return rows.length===1;
}
export async function withdrawEntry(context:RegisterContext,playerId:string,id:string) {
  const rows=await queryD1(`UPDATE wpu_event_entries SET status='withdrawn',invite=NULL,reserved=0,hold_until=NULL
    WHERE id=? AND event_id=? AND division_id=? AND (lead_id=? OR partner_id=?)
    AND status IN ('invited','offered','waitlisted','ready','confirmed') AND payment_ref IS NULL RETURNING id`,
    [id,context.eventId,context.divisionId,playerId,playerId]);
  if (rows.length)await reconcile(context.eventId,context.divisionId);
  return rows.length===1;
}
