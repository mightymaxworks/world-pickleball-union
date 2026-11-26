import { createHash, randomBytes } from "node:crypto";
import { queryD1 } from "@/lib/supporters-db";
import { isFederationSlug } from "./slug";
import { onlineRequestCondition } from "./availability";

export function federationPilotEnabled(): boolean {
  const context = (globalThis as unknown as Record<symbol, {env?: {WPU_FEDERATION_PILOT_ENABLED?: string}} | undefined>)[Symbol.for("__cloudflare-context__")];
  return (context?.env?.WPU_FEDERATION_PILOT_ENABLED ?? process.env.WPU_FEDERATION_PILOT_ENABLED) === "true";
}

export const enabledFederation = `FROM wpu_federation_portals f
  JOIN wpu_organisations o ON o.id=f.organisation_id AND o.status='verified'
  AND o.organisation_type='national_federation'`;
export const approvedMembership = `JOIN wpu_memberships m ON m.organisation_id=o.id
  AND m.membership_type='organisation' AND m.status='active'
  AND (m.valid_from IS NULL OR julianday(m.valid_from)<=julianday('now'))
  AND (m.valid_until IS NULL OR julianday(m.valid_until)>julianday('now'))
  JOIN wpu_affiliation_requests c ON c.organisation_id=o.id AND c.person_id=m.person_id
  AND c.state='approved' AND m.id='affiliation:'||c.id`;
export const scopedAdmin = `JOIN wpu_accounts a ON a.id=? AND a.status='active'
  WHERE f.enabled=1 AND EXISTS (SELECT 1 FROM wpu_role_assignments r WHERE r.account_id=a.id
    AND r.scope_type='organisation' AND r.scope_id=o.id AND r.role='organisation_admin' AND r.revoked_at IS NULL)
  AND EXISTS (SELECT 1 FROM wpu_auth_emails e WHERE e.account_id=a.id AND e.email_normalized=? AND e.verified_at IS NOT NULL)`;

/** Only public names, country codes and URLs of federations accepting online requests. */
export async function playerFederations() {
  const requestsOpen = await onlineRequestCondition();
  const rows = await queryD1(
    `SELECT f.slug,o.name,o.country_code ${enabledFederation}
      JOIN wpu_affiliation_self_request_orgs s ON s.organisation_id=o.id
      WHERE f.enabled=1 AND ${requestsOpen} ORDER BY o.name COLLATE NOCASE,f.slug`);
  return rows.flatMap(row => isFederationSlug(row.slug) ? [{
    slug: row.slug, name: String(row.name), countryCode: typeof row.country_code === "string" ? row.country_code : null,
  }] : []);
}

export async function federationPortal(slug: string, account: string | null) {
  if (!isFederationSlug(slug)) return null;
  const requestsOpen = await onlineRequestCondition();
  const [row] = await queryD1(
    `SELECT o.id,o.name,
      (EXISTS (SELECT 1 FROM wpu_affiliation_self_request_orgs s WHERE s.organisation_id=o.id) AND ${requestsOpen}) AS accepting,
      EXISTS (SELECT 1 FROM wpu_accounts a JOIN wpu_player_profiles p ON p.person_id=a.person_id
        JOIN wpu_auth_emails e ON e.account_id=a.id AND e.verified_at IS NOT NULL
        WHERE a.id=? AND a.status='active') AS eligible,
      (SELECT c.state FROM wpu_affiliation_requests c JOIN wpu_accounts a ON a.person_id=c.person_id
        WHERE a.id=? AND a.status='active' AND c.organisation_id=o.id
        ORDER BY c.state IN ('awaiting_player','awaiting_review','approved') DESC,c.updated_at DESC,c.id LIMIT 1) AS state
     ${enabledFederation} WHERE f.enabled=1 AND f.slug=?`, [account, account, slug]);
  return row ? { id: String(row.id), name: String(row.name), accepting: row.accepting === 1,
    eligible: row.eligible === 1, state: typeof row.state === "string" ? row.state : null } : null;
}

export type FederationAdmin = { account: string; email: string };
export type RosterStatus = "listed" | "on_hold";
export const rosterPageSize = 50;
export async function federationAdminScopes(admin: FederationAdmin) {
  const rows = await queryD1(`SELECT f.slug,o.name ${enabledFederation} ${scopedAdmin} ORDER BY o.name,f.slug`,
    [admin.account, admin.email]);
  return rows.map(row => ({ slug: String(row.slug), name: String(row.name) }));
}

export async function federationRoster(admin: FederationAdmin, slug: string, after: string) {
  const rows = await queryD1(
    `SELECT m.id AS cursor,p.public_player_code AS playerId,n.display_name AS displayName,
     coalesce((SELECT e.roster_status FROM wpu_federation_roster_events e WHERE e.membership_id=m.id
       ORDER BY e.sequence DESC LIMIT 1),'listed') AS rosterStatus
     ${enabledFederation} ${approvedMembership} JOIN wpu_player_profiles p ON p.person_id=m.person_id
     JOIN wpu_persons n ON n.id=m.person_id ${scopedAdmin}
     AND f.slug=? AND m.id>? ORDER BY m.id LIMIT ?`, [admin.account, admin.email, slug, after, rosterPageSize + 1]);
  const page = rows.slice(0, rosterPageSize);
  return { players: page.map(row => ({ playerId: String(row.playerId), displayName: String(row.displayName),
    rosterStatus: row.rosterStatus as RosterStatus })), next: rows.length > rosterPageSize ? String(page.at(-1)?.cursor) : null };
}

export async function setRosterStatus(admin: FederationAdmin, slug: string, playerId: string, status: RosterStatus) {
  const rows = await queryD1(
    `INSERT INTO wpu_federation_roster_events(membership_id,actor_account_id,roster_status)
     SELECT m.id,a.id,? ${enabledFederation} ${approvedMembership}
     JOIN wpu_player_profiles p ON p.person_id=m.person_id ${scopedAdmin}
     AND f.slug=? AND p.public_player_code=?
     AND coalesce((SELECT e.roster_status FROM wpu_federation_roster_events e WHERE e.membership_id=m.id
       ORDER BY e.sequence DESC LIMIT 1),'listed')<>?
     RETURNING sequence`, [status, admin.account, admin.email, slug, playerId, status]);
  return rows.length === 1;
}

const identityClient = `JOIN wpu_federation_identity_clients cl ON cl.organisation_id=o.id AND cl.enabled=1`;
const verifiedPlayerAccount = `JOIN wpu_accounts a ON a.person_id=m.person_id AND a.status='active'
  JOIN wpu_player_profiles p ON p.person_id=m.person_id
  WHERE f.enabled=1 AND EXISTS (SELECT 1 FROM wpu_auth_emails e WHERE e.account_id=a.id AND e.verified_at IS NOT NULL)`;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export const identityGrantSeconds = 120;
export const identityToken = /^[A-Za-z0-9_-]{43}$/;

export async function issueIdentityGrant(account: string, client: string) {
  const code = randomBytes(32).toString("base64url");
  const result = await queryD1(
    `INSERT INTO wpu_federation_identity_grants(grant_hash,client_id,membership_id,account_id,expires_at)
     SELECT ?,cl.id,m.id,a.id,? ${enabledFederation} ${approvedMembership} ${identityClient} ${verifiedPlayerAccount}
     AND a.id=? AND cl.id=?
     ON CONFLICT(client_id,membership_id) DO UPDATE SET grant_hash=excluded.grant_hash,account_id=excluded.account_id,expires_at=excluded.expires_at
     RETURNING grant_hash`, [hash(code), new Date(Date.now() + identityGrantSeconds * 1000).toISOString(), account, client]);
  return result.length === 1 ? code : null;
}

export async function exchangeIdentityGrant(client: string, key: string, code: string) {
  // DELETE...RETURNING consumes the code atomically. Eligibility and the client scope
  // are rechecked at redemption, including membership/role-independent affiliation revocation.
  const grants = await queryD1(
    `DELETE FROM wpu_federation_identity_grants AS g
     WHERE g.grant_hash=? AND g.client_id=? AND g.expires_at>?
     AND EXISTS(SELECT 1 ${enabledFederation} ${approvedMembership} ${identityClient} ${verifiedPlayerAccount}
       AND a.id=g.account_id AND m.id=g.membership_id AND cl.id=g.client_id AND cl.key_hash=?)
     RETURNING (SELECT p.public_player_code FROM wpu_memberships m JOIN wpu_player_profiles p ON p.person_id=m.person_id
        WHERE m.id=membership_id) AS playerId,
       (SELECT n.display_name FROM wpu_accounts a JOIN wpu_persons n ON n.id=a.person_id WHERE a.id=account_id) AS displayName,
       (SELECT cl.organisation_id FROM wpu_federation_identity_clients cl WHERE cl.id=client_id) AS organisationId`,
    [hash(code), client, new Date().toISOString(), hash(key)]);
  const row = grants[0];
  return row ? { playerId: String(row.playerId), displayName: String(row.displayName), organisationId: String(row.organisationId) } : null;
}
