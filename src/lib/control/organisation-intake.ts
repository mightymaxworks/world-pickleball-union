import { randomUUID } from "node:crypto";
import { batchD1, queryD1 } from "@/lib/supporters-db";
import { isIntakeOrganisationType, isIntakeDecision, type IntakeCase, type IntakeDecision } from "@/lib/organisation-intake-types";

type Reviewer = { account: string; email: string };
const reviewerCondition = `EXISTS (SELECT 1 FROM wpu_accounts a JOIN wpu_auth_emails e ON e.account_id=a.id
  WHERE a.id=? AND a.status='active' AND e.email_normalized=? AND e.verified_at IS NOT NULL AND (
   EXISTS (SELECT 1 FROM wpu_role_assignments r WHERE r.account_id=a.id AND r.role='wpu_admin'
     AND r.scope_type='global' AND r.revoked_at IS NULL)
   OR EXISTS (SELECT 1 FROM wpu_organisation_intake_reviewers r WHERE r.account_id=a.id AND r.revoked_at IS NULL)))`;
const recent = "(SELECT max(sequence) FROM wpu_organisation_intake_events WHERE inquiry_id=i.id)";
const lastEvent = `LEFT JOIN wpu_organisation_intake_events v ON v.sequence=${recent}`;
const active = "i.form_type='membership' AND i.status='pending'";
const open = `${active} AND NOT EXISTS(SELECT 1 FROM wpu_organisation_intake_events f WHERE f.inquiry_id=i.id AND f.decision<>'follow_up')`;
const detailsType = "CASE WHEN json_valid(i.details_json) THEN json_extract(i.details_json,'$.organisationType') END";

export async function canReviewOrganisationIntake(reviewer: Reviewer) {
  const [row] = await queryD1(`SELECT 1 AS allowed WHERE ${reviewerCondition}`, [reviewer.account, reviewer.email]);
  return row?.allowed === 1;
}

function toCase(row: Record<string, unknown>): IntakeCase {
  let details: Record<string, unknown> = {};
  try { details = JSON.parse(String(row.details_json)) || {}; } catch { /* legacy malformed fields stay hidden */ }
  const detail = (name: string) => typeof details[name] === "string" ? details[name] : "";
  return {
    reference: String(row.id), name: String(row.organisation), country: String(row.country),
    type: isIntakeOrganisationType(details.organisationType) ? details.organisationType : null,
    contact: String(row.contact_name), email: String(row.email), role: detail("role"), website: detail("website"),
    message: detail("message"), createdAt: String(row.created_at), closed: row.status !== "pending", version: Number(row.sequence ?? 0),
    review: isIntakeDecision(row.decision) ? { decision: row.decision, name: String(row.reviewer ?? "WPU reviewer"),
      reason: String(row.reason), createdAt: String(row.reviewed_at),
      organisationId: typeof row.organisation_id === "string" ? row.organisation_id : null } : null,
  };
}

export async function organisationIntakeQueue(reviewer: Reviewer, reference: string | null, filter: "open" | "completed", offset: number) {
  const selected = reference ? "i.id=?" : filter === "open" ? open :
    "(i.status<>'pending' OR v.decision IN ('approve_existing','approve_new','close'))";
  const rows = await queryD1(
    `SELECT i.*,v.sequence,v.decision,v.reason,v.organisation_id,v.created_at AS reviewed_at,n.display_name AS reviewer
     FROM wpu_inquiries i ${lastEvent}
     LEFT JOIN wpu_accounts a ON a.id=v.reviewer_account_id LEFT JOIN wpu_persons n ON n.id=a.person_id
     WHERE i.form_type='membership' AND ${reviewerCondition} AND (${selected})
     ORDER BY i.created_at DESC,i.id LIMIT ? OFFSET ?`,
    [reviewer.account, reviewer.email, ...(reference ? [reference] : []), reference ? 1 : 26, reference ? 0 : offset]);
  return { cases: rows.slice(0, 25).map(toCase), hasMore: rows.length > 25 };
}

const candidateCondition = `o.status<>'suspended' AND (
  (length(i.country)=2 AND o.country_code=i.country AND (${detailsType} IS NULL OR o.organisation_type=${detailsType}))
  OR (length(i.country)<>2 AND lower(trim(o.name))=lower(trim(i.organisation))))`;

export async function findIntakeOrganisations(reviewer: Reviewer, reference: string, q: string) {
  const rows = await queryD1(
    `SELECT o.id,o.name,o.country_code,o.organisation_type,o.status FROM wpu_inquiries i
     JOIN wpu_organisations o ON ${candidateCondition}
     WHERE i.id=? AND ${open} AND ${reviewerCondition}
     AND (?='' OR instr(lower(o.name),lower(?))>0 OR o.id=?)
     ORDER BY lower(trim(o.name))=lower(trim(i.organisation)) DESC,o.name,o.id LIMIT 16`,
    [reference,reviewer.account,reviewer.email,q,q,q]);
  return rows.map(r => ({ id: String(r.id), name: String(r.name), country: r.country_code, status:r.status }));
}

export async function reviewOrganisationIntake(
  reviewer: Reviewer, reference: string, decision: IntakeDecision, version: number, reason: string, existingId: string,
) {
  const eligible = `i.id=? AND ${open} AND coalesce(${recent},0)=? AND ${reviewerCondition}`;
  const guardParams = [reference, version, reviewer.account, reviewer.email];
  const event = `INSERT INTO wpu_organisation_intake_events (inquiry_id,reviewer_account_id,decision,reason,organisation_id)
    SELECT i.id,?,?,?,? FROM wpu_inquiries i WHERE ${eligible}`;
  const verify = [reviewer.account, decision, reason];
  if (decision === "approve_new") {
    const id = "intake:" + randomUUID();
    await batchD1([
      { sql: `INSERT INTO wpu_organisations (id,name,country_code,organisation_type,status)
         SELECT ?,i.organisation,i.country,${detailsType},'pending' FROM wpu_inquiries i WHERE ${eligible}
         AND length(i.country)=2 AND ${detailsType} IN ('national_federation','regional_association','district_association','club','other')
         AND NOT EXISTS (SELECT 1 FROM wpu_organisations o WHERE lower(trim(o.name))=lower(trim(i.organisation))
           AND (o.country_code=i.country OR o.country_code IS NULL))`, params: [id,...guardParams] },
      { sql: event + " AND EXISTS (SELECT 1 FROM wpu_organisations WHERE id=?)", params: [...verify,id,...guardParams,id] },
    ]);
    const [result] = await queryD1(`SELECT sequence FROM wpu_organisation_intake_events
      WHERE inquiry_id=? AND reviewer_account_id=? AND organisation_id=?`, [reference,reviewer.account,id]);
    return Boolean(result);
  }
  const linking = decision === "approve_existing";
  const rows = await queryD1(event + (linking
    ? ` AND EXISTS (SELECT 1 FROM wpu_organisations o WHERE o.id=? AND ${candidateCondition})` : "") +
    " RETURNING sequence", [...verify, linking ? existingId : null,...guardParams,...(linking ? [existingId] : [])]);
  return rows.length === 1;
}
