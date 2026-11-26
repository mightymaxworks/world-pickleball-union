import { queryD1 } from "@/lib/supporters-db";
import { activationCandidateCondition, activationEventJoin, activationPortalJoin, activationState } from "@/lib/federations/activation";

export const organisationTypes = {
  international: "International organisation",
  national_federation: "National federation",
  regional_association: "Regional association",
  district_association: "District association",
  club: "Club",
  school: "School",
  academy: "Academy",
  tournament_organiser: "Tournament organiser",
  other: "Other organisation",
} as const;

export const organisationStates = { pending: "Pending verification", verified: "Verified record", suspended: "Suspended" } as const;
export const portalStates = { unpublished: "Not open", open: "Open to players", paused: "New requests paused" } as const;
export const activityKinds = { submission: "Applications", review: "Review decisions", portal: "Federation portals" } as const;
export const activityActions: Record<string, string> = {
  submitted: "Application submitted",
  follow_up: "Follow-up requested",
  approve_new: "Approved and created organisation",
  approve_existing: "Approved and linked organisation",
  close: "Closed without approval",
  open: "Opened federation portal",
  resumed: "Resumed affiliation requests",
  paused: "Paused new affiliation requests",
};

type Row = Record<string, unknown>;
export type Organisation = {
  id: string; name: string; country: string | null; type: string; status: string;
  portal: keyof typeof portalStates | null; eligible: boolean; slug: string | null;
  application: string | null; latestAt: string;
};
export type Activity = {
  key: string; kind: string; action: string; name: string; actor: string;
  at: string; organisationId: string | null; reference: string | null;
};
export const PAGE_SIZE = 25;
export function labelFor<T extends Record<string, string>>(labels: T, value: string) {
  return Object.hasOwn(labels, value) ? labels[value as keyof T] : value;
}

const latestApproval = `LEFT JOIN wpu_organisation_intake_events a ON a.sequence=(
  SELECT max(aa.sequence) FROM wpu_organisation_intake_events aa WHERE aa.organisation_id=o.id)`;
const portal = `CASE WHEN o.organisation_type='national_federation' THEN ${activationState} ELSE NULL END`;
const directory = `SELECT o.id,o.name,o.country_code,o.organisation_type,o.status,
  ${portal} AS portal,CASE WHEN ${activationCandidateCondition} THEN 1 ELSE 0 END AS eligible,
  f.slug,a.inquiry_id AS application,max(o.created_at,coalesce(a.created_at,''),coalesce(v.created_at,'')) AS latest_at
  FROM wpu_organisations o ${activationPortalJoin} ${activationEventJoin} ${latestApproval}`;
const mapOrganisation = (r: Row): Organisation => ({
  id: String(r.id), name: String(r.name), country: typeof r.country_code === "string" ? r.country_code : null,
  type: String(r.organisation_type), status: String(r.status), eligible: r.eligible === 1,
  portal: typeof r.portal === "string" && Object.hasOwn(portalStates,r.portal) ? r.portal as Organisation["portal"] : null,
  slug: typeof r.slug === "string" ? r.slug : null,
  application: typeof r.application === "string" ? r.application : null, latestAt: String(r.latest_at),
});

export async function operationsDirectory(filters: {q: string; type: string; country: string; status: string; portal: string; source: string; offset: number}) {
  const {q,type,country,status,portal: portalFilter,source,offset} = filters;
  const rows = await queryD1(`WITH directory AS (${directory}) SELECT * FROM directory
    WHERE (?='' OR instr(lower(name),lower(?))>0 OR lower(id)=lower(?))
      AND (?='' OR organisation_type=?) AND (?='' OR upper(country_code)=?)
      AND (?='' OR status=?) AND (?='' OR portal=?)
      AND (?<>'unpublished' OR eligible=1) AND (?<>'approved' OR application IS NOT NULL)
    ORDER BY name COLLATE NOCASE,id LIMIT ? OFFSET ?`,
    [q,q,q,type,type,country,country,status,status,portalFilter,portalFilter,portalFilter,source,PAGE_SIZE+1,offset]);
  return {items: rows.slice(0,PAGE_SIZE).map(mapOrganisation), hasMore: rows.length>PAGE_SIZE};
}

// Full network visibility belongs to operations staff. Intake-only staff can follow
// a completed decision to its explicitly linked record, without browsing the network.
export async function operationsRecord(id: string, networkAccess: boolean) {
  const [row] = networkAccess ? await queryD1(directory + " WHERE o.id=?", [id]) :
    await queryD1(`SELECT o.*,a.inquiry_id AS application,max(o.created_at,a.created_at) AS latest_at
      FROM wpu_organisations o ${latestApproval}
      WHERE o.id=? AND a.decision IN ('approve_existing','approve_new')`, [id]);
  return row ? mapOrganisation(row) : null;
}

const activity = `SELECT 'submission:'||i.id AS key,'submission' AS kind,'submitted' AS action,
    i.organisation AS name,i.contact_name AS actor,i.created_at AS at,a.organisation_id,i.id AS reference
  FROM wpu_inquiries i
  LEFT JOIN wpu_organisation_intake_events a ON a.inquiry_id=i.id AND a.organisation_id IS NOT NULL
  WHERE i.form_type='membership'
  UNION ALL
  SELECT 'review:'||r.sequence,'review',r.decision,coalesce(o.name,i.organisation),
    coalesce(p.display_name,'WPU reviewer'),r.created_at,r.organisation_id,i.id
  FROM wpu_organisation_intake_events r JOIN wpu_inquiries i ON i.id=r.inquiry_id
  LEFT JOIN wpu_organisations o ON o.id=r.organisation_id
  LEFT JOIN wpu_accounts u ON u.id=r.reviewer_account_id LEFT JOIN wpu_persons p ON p.id=u.person_id
  UNION ALL
  SELECT 'portal:'||e.sequence,'portal',CASE WHEN e.state='open' AND EXISTS (
    SELECT 1 FROM wpu_federation_activation_events prior WHERE prior.organisation_id=e.organisation_id
      AND prior.sequence<e.sequence AND prior.state='paused') THEN 'resumed' ELSE e.state END,
    o.name,coalesce(p.display_name,'WPU publisher'),
    e.created_at,e.organisation_id,NULL
  FROM wpu_federation_activation_events e JOIN wpu_organisations o ON o.id=e.organisation_id
  LEFT JOIN wpu_accounts u ON u.id=e.actor_account_id LEFT JOIN wpu_persons p ON p.id=u.person_id`;

export async function operationsActivity(filters: {q?: string; kind?: string; from?: string; to?: string; id?: string; offset?: number} = {}, pageSize = PAGE_SIZE) {
  const {q="",kind="",from="",to="",id="",offset=0} = filters;
  const rows = await queryD1(`WITH activity AS (${activity}) SELECT * FROM activity
    WHERE (?='' OR instr(lower(name),lower(?))>0)
      AND (?='' OR kind=?) AND (?='' OR date(at)>=?) AND (?='' OR date(at)<=?)
      AND (?='' OR organisation_id=?)
    ORDER BY at DESC,CASE kind WHEN 'portal' THEN 0 WHEN 'review' THEN 1 ELSE 2 END,CAST(substr(key,instr(key,':')+1) AS INTEGER) DESC,key DESC LIMIT ? OFFSET ?`,
    [q,q,kind,kind,from,from,to,to,id,id,pageSize+1,offset]);
  return {items: rows.slice(0,pageSize).map((r): Activity => ({
    key: String(r.key), kind: String(r.kind), action: String(r.action), name: String(r.name),
    actor: typeof r.actor === "string" ? r.actor : "", at: String(r.at),
    organisationId: typeof r.organisation_id === "string" ? r.organisation_id : null,
    reference: typeof r.reference === "string" ? r.reference : null,
  })), hasMore: rows.length>pageSize};
}

export async function operationsOverview() {
  const [[intake],[network],recent] = await Promise.all([
    queryD1(`SELECT
      count(CASE WHEN v.sequence IS NULL THEN 1 END) AS new_requests,
      count(CASE WHEN v.decision='follow_up' THEN 1 END) AS follow_up
      FROM wpu_inquiries i LEFT JOIN wpu_organisation_intake_events v ON v.sequence=(
        SELECT max(x.sequence) FROM wpu_organisation_intake_events x WHERE x.inquiry_id=i.id)
      WHERE i.form_type='membership' AND i.status='pending'
        AND (v.sequence IS NULL OR v.decision='follow_up')`),
    queryD1(`WITH directory AS (${directory}) SELECT count(*) AS organisations,
      count(CASE WHEN eligible=1 AND portal='unpublished' THEN 1 END) AS setup,
      count(CASE WHEN portal='open' THEN 1 END) AS open,
      count(CASE WHEN portal='paused' THEN 1 END) AS paused FROM directory`),
    operationsActivity({}, 7),
  ]);
  return {
    newRequests: Number(intake.new_requests), followUp: Number(intake.follow_up),
    organisations: Number(network.organisations), setup: Number(network.setup),
    open: Number(network.open), paused: Number(network.paused), recent: recent.items,
  };
}
