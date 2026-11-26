import { queryD1 } from "@/lib/supporters-db";
import { approvedMembership, enabledFederation, scopedAdmin, rosterPageSize } from "./service";
import type { FederationAdmin, RosterStatus } from "./service";
import type { MemberCategory, MemberFields, MemberFilters, MemberRecord, MemberSummary } from "./member-fields";

export const memberCsvLimit = 1000;

export async function federationMemberWorkspaceReady() {
  const [row] = await queryD1(
    "SELECT count(*) AS ready FROM wpu_schema_migrations WHERE filename='wpu-federation-members-v1.sql'");
  return row?.ready === 1;
}

const latestEvent = `LEFT JOIN wpu_federation_roster_events e ON e.sequence=(
  SELECT sequence FROM wpu_federation_roster_events WHERE membership_id=m.id ORDER BY sequence DESC LIMIT 1)`;
const detailsJoin = `LEFT JOIN wpu_federation_member_details d ON d.organisation_id=o.id AND d.person_id=m.person_id`;
const scopedMembers = `${enabledFederation} ${approvedMembership}
  JOIN wpu_player_profiles p ON p.person_id=m.person_id JOIN wpu_persons n ON n.id=m.person_id
  ${detailsJoin} ${latestEvent} ${scopedAdmin} AND f.slug=?`;
const summaryFields = `p.public_player_code AS playerId,n.display_name AS displayName,
  coalesce(e.roster_status,'listed') AS rosterStatus,
  d.membership_number AS membershipNumber,d.club,d.category`;
const strOrNull = (value: unknown) => typeof value === "string" ? value : null;

function summary(row: Record<string, unknown>): MemberSummary {
  return {
    playerId: String(row.playerId), displayName: String(row.displayName), rosterStatus: row.rosterStatus as RosterStatus,
    membershipNumber: strOrNull(row.membershipNumber), club: strOrNull(row.club), category: row.category as MemberCategory | null,
  };
}

export async function federationMembers(
  admin: FederationAdmin, slug: string, filters: MemberFilters, after: string, exportCsv = false,
) {
  const limit = exportCsv ? memberCsvLimit : rosterPageSize;
  const rows = await queryD1(
    `WITH roster AS (SELECT m.id AS cursor,${summaryFields} ${scopedMembers}),
      matching AS (SELECT * FROM roster
        WHERE (?='' OR instr(lower(displayName),lower(?))>0 OR instr(lower(playerId),lower(?))>0
          OR instr(lower(coalesce(membershipNumber,'')),lower(?))>0)
        AND (?='' OR instr(lower(coalesce(club,'')),lower(?))>0)
        AND (?='' OR category=?) AND (?='' OR rosterStatus=?)),
      page AS (SELECT * FROM matching WHERE cursor>? ORDER BY cursor LIMIT ?)
    SELECT page.*,totals.total FROM (SELECT count(*) AS total FROM matching) totals
    LEFT JOIN page ON 1=1 ORDER BY page.cursor`,
    [admin.account, admin.email, slug, filters.q, filters.q, filters.q, filters.q, filters.club, filters.club,
      filters.category, filters.category, filters.status, filters.status, after, limit + 1]);
  const page = rows.filter(row => row.cursor !== null).slice(0, limit);
  return { members: page.map(summary), total: Number(rows[0]?.total ?? 0),
    next: page.length && rows.length > limit ? String(page.at(-1)?.cursor) : null };
}

export async function federationMember(admin: FederationAdmin, slug: string, playerId: string): Promise<MemberRecord | null> {
  const target = `${scopedMembers} AND p.public_player_code=?`;
  const params = [admin.account, admin.email, slug, playerId];
  const rows = await queryD1(
    `SELECT target.*,h.roster_status AS action,h.created_at AS changedAt,h.reason,u.display_name AS actor
     FROM (SELECT m.id,${summaryFields},d.joined_on AS joinedOn,d.renewal_on AS renewalOn,
       coalesce(d.revision,0) AS revision,coalesce(e.sequence,0) AS rosterRevision ${target}) target
     LEFT JOIN wpu_federation_roster_events h ON h.membership_id=target.id
     LEFT JOIN wpu_accounts a ON a.id=h.actor_account_id
     LEFT JOIN wpu_persons u ON u.id=a.person_id
     ORDER BY h.sequence DESC LIMIT 30`, params);
  const row = rows[0];
  return row ? {
    ...summary(row), affiliation: "approved", joinedOn: strOrNull(row.joinedOn), renewalOn: strOrNull(row.renewalOn),
    revision: Number(row.revision), rosterRevision: Number(row.rosterRevision),
    history: rows.filter(item => item.action !== null).map(item => ({
      status: item.action as RosterStatus, actor: strOrNull(item.actor) ?? "Staff account",
      changedAt: String(item.changedAt), reason: strOrNull(item.reason),
    })),
  } : null;
}

export async function saveFederationMember(
  admin: FederationAdmin, slug: string, playerId: string, fields: MemberFields, revision: number,
) {
  const rows = await queryD1(
    `INSERT INTO wpu_federation_member_details (
       organisation_id,person_id,membership_number,club,category,joined_on,renewal_on,revision,updated_by_account_id)
     SELECT o.id,m.person_id,?,?,?,?,?,coalesce(d.revision,0)+1,a.id
     ${scopedMembers} AND p.public_player_code=? AND coalesce(d.revision,0)=?
     AND NOT EXISTS(SELECT 1 FROM wpu_federation_member_details x WHERE x.organisation_id=o.id
       AND x.membership_number=? AND x.person_id<>m.person_id)
     ON CONFLICT(organisation_id,person_id) DO UPDATE SET membership_number=excluded.membership_number,
       club=excluded.club,category=excluded.category,joined_on=excluded.joined_on,renewal_on=excluded.renewal_on,
       revision=excluded.revision,updated_at=datetime('now'),updated_by_account_id=excluded.updated_by_account_id
     RETURNING revision`,
    [fields.membershipNumber, fields.club, fields.category, fields.joinedOn, fields.renewalOn,
      admin.account, admin.email, slug, playerId, revision, fields.membershipNumber]);
  return rows.length === 1;
}

export async function updateFederationRosterStatus(
  admin: FederationAdmin, slug: string, playerId: string, status: RosterStatus, reason: string, revision: number,
) {
  const rows = await queryD1(
    `INSERT INTO wpu_federation_roster_events(membership_id,actor_account_id,roster_status,reason)
     SELECT m.id,a.id,?,? ${scopedMembers} AND p.public_player_code=?
     AND coalesce(e.roster_status,'listed')<>? AND coalesce(e.sequence,0)=?
     RETURNING sequence`,
    [status, reason, admin.account, admin.email, slug, playerId, status, revision]);
  return rows.length === 1;
}
