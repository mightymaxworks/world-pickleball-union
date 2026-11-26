import { queryD1 } from "@/lib/supporters-db";
import type { ActivationAction, ActivationCandidate, PublicationState } from "./activation-types";
import type { FederationAdmin } from "./service";
import { federationActivationReady } from "./availability";

const publisher = `EXISTS (SELECT 1 FROM wpu_accounts a JOIN wpu_auth_emails e ON e.account_id=a.id
  WHERE a.id=? AND a.status='active' AND e.email_normalized=? AND e.verified_at IS NOT NULL AND (
   EXISTS (SELECT 1 FROM wpu_role_assignments g WHERE g.account_id=a.id AND g.role='wpu_admin'
     AND g.scope_type='global' AND g.revoked_at IS NULL)
   OR EXISTS (SELECT 1 FROM wpu_federation_publishers g WHERE g.account_id=a.id AND g.revoked_at IS NULL)))`;
export const activationCandidateCondition = `o.organisation_type='national_federation' AND (o.status='verified' OR
  (o.status='pending' AND EXISTS (SELECT 1 FROM wpu_organisation_intake_events i
    WHERE i.organisation_id=o.id AND i.decision IN ('approve_new','approve_existing'))))`;
export const activationEventJoin = `LEFT JOIN wpu_federation_activation_events v ON v.sequence=(
  SELECT max(sequence) FROM wpu_federation_activation_events WHERE organisation_id=o.id)`;
export const activationPortalJoin = `LEFT JOIN wpu_federation_portals f ON f.organisation_id=o.id`;
export const activationState = `CASE WHEN v.state='paused' THEN 'paused'
  WHEN f.enabled=1 AND EXISTS (SELECT 1 FROM wpu_affiliation_self_request_orgs s WHERE s.organisation_id=o.id)
  THEN 'open' ELSE 'unpublished' END`;
const hasStaff = (role: "organisation_admin" | "wpu_reviewer") =>
  `EXISTS (SELECT 1 FROM wpu_role_assignments r JOIN wpu_accounts a ON a.id=r.account_id AND a.status='active'
  WHERE r.scope_type='organisation' AND r.scope_id=o.id AND r.revoked_at IS NULL AND r.role='${role}'
   AND EXISTS (SELECT 1 FROM wpu_auth_emails e WHERE e.account_id=a.id AND e.verified_at IS NOT NULL))`;
const operator = hasStaff("organisation_admin");
const reviewer = hasStaff("wpu_reviewer");

export async function canPublishFederation(staff: FederationAdmin) {
  if (!await federationActivationReady()) return false;
  const [row] = await queryD1(`SELECT 1 AS allowed WHERE ${publisher}`, [staff.account,staff.email]);
  return row?.allowed === 1;
}

export async function federationActivationCandidates(staff: FederationAdmin, q: string, offset: number, organisationId = "") {
  const rows = await queryD1(
    `SELECT o.id,o.name,o.country_code,o.status,f.slug,${activationState} AS availability,
            ${operator} AS operator,${reviewer} AS reviewer,
            coalesce(v.sequence,0) AS revision, v.created_at,v.reason,p.display_name AS actor
     FROM wpu_organisations o ${activationPortalJoin} ${activationEventJoin}
     LEFT JOIN wpu_accounts a ON a.id=v.actor_account_id LEFT JOIN wpu_persons p ON p.id=a.person_id
     WHERE ${activationCandidateCondition} AND ${publisher}
      AND (?='' OR o.id=?) AND (?='' OR instr(lower(o.name),lower(?))>0 OR lower(o.country_code)=lower(?) OR f.slug=?)
     ORDER BY o.name COLLATE NOCASE,o.id LIMIT 26 OFFSET ?`,
     [staff.account,staff.email,organisationId,organisationId,q,q,q,q,offset]);
  return { hasMore: rows.length > 25, items: rows.slice(0,25).map((row): ActivationCandidate => ({
    id: String(row.id), name: String(row.name), countryCode: typeof row.country_code === "string" ? row.country_code : null,
    slug: typeof row.slug === "string" ? row.slug : null, state: row.availability as PublicationState,
    revision: Number(row.revision), verified: row.status === "verified",
    hasOperator: row.operator === 1, hasReviewer: row.reviewer === 1,
    lastAction: row.revision ? { actor: String(row.actor), at: String(row.created_at), reason: String(row.reason) } : null,
  })) };
}

export async function changeFederationActivation(staff: FederationAdmin, data: {
  action: ActivationAction; organisationId: string; revision: number; reason: string; slug: string | null; operatorEmail: string | null;
}) {
  const rows = await queryD1(
    `WITH target AS (
       SELECT o.id,f.slug AS existing_slug, coalesce(v.sequence,0) AS revision,${activationState} AS state,
         ${operator} AS has_operator,${reviewer} AS has_reviewer,
         (SELECT a.id FROM wpu_auth_emails e JOIN wpu_accounts a ON a.id=e.account_id AND a.status='active'
           WHERE e.email_normalized=? AND e.verified_at IS NOT NULL) AS nominee
       FROM wpu_organisations o ${activationPortalJoin} ${activationEventJoin}
       WHERE o.id=? AND ${activationCandidateCondition} AND ${publisher}
     )
     INSERT INTO wpu_federation_activation_events(organisation_id,slug,state,actor_account_id,added_operator_account_id,added_reviewer_account_id,reason)
     SELECT id,coalesce(existing_slug,?),?,?,CASE WHEN ?='open' THEN nominee ELSE NULL END,
        CASE WHEN ?='open' AND has_reviewer=0 THEN ? ELSE NULL END,?
     FROM target
     WHERE revision=? AND ((?='paused' AND state='open') OR (?='open' AND state<>'open' AND
       (existing_slug IS NOT NULL OR ? IS NOT NULL) AND (? IS NULL OR existing_slug IS NULL OR existing_slug=?) AND
       (? IS NULL OR nominee IS NOT NULL) AND (has_operator=1 OR nominee IS NOT NULL) AND
       NOT EXISTS (SELECT 1 FROM wpu_federation_portals WHERE slug=coalesce(existing_slug,?) AND organisation_id<>target.id)))
     RETURNING sequence,slug,state`,
    [data.operatorEmail,data.organisationId,staff.account,staff.email,data.slug,data.action,staff.account,data.action,
     data.action,staff.account,data.reason,data.revision,data.action,data.action,data.slug,data.slug,data.slug,data.operatorEmail,data.slug]);
  const row = rows[0];
  return row ? { revision: Number(row.sequence), slug: String(row.slug), state: row.state as ActivationAction } : null;
}
