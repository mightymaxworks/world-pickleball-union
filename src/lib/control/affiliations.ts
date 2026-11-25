import { randomUUID } from "node:crypto";
import { queryD1 } from "@/lib/supporters-db";
import type { AffiliationCase, AffiliationDecision, AffiliationInvitation, AffiliationState } from "./types";

export async function affiliationWorkspace(account: string) {
  const roles = await queryD1(
    `SELECT o.id,o.name,r.role FROM wpu_role_assignments r JOIN wpu_organisations o ON o.id=r.scope_id
     JOIN wpu_accounts a ON a.id=r.account_id AND a.status='active'
     WHERE r.account_id=? AND r.scope_type='organisation' AND r.revoked_at IS NULL
       AND (r.role='wpu_reviewer' OR (r.role='organisation_admin' AND o.status='verified'))
     ORDER BY o.name,o.id`, [account]);
  if (!roles.length) return null;

  const records = await queryD1(
    `WITH scoped_cases AS (
       SELECT c.id,c.state,c.updated_at,o.name,substr(pp.public_player_code,-8) AS ending,
        EXISTS (SELECT 1 FROM wpu_role_assignments r
          WHERE r.account_id=a.id AND r.revoked_at IS NULL AND r.role='wpu_reviewer'
            AND r.scope_type='organisation' AND r.scope_id=o.id
            AND a.person_id<>c.person_id AND a.person_id<>proposer.person_id) AS can_review,
        o.status='verified' AS verified
       FROM wpu_affiliation_requests c JOIN wpu_organisations o ON o.id=c.organisation_id
       JOIN wpu_player_profiles pp ON pp.person_id=c.person_id
       JOIN wpu_accounts a ON a.id=? AND a.status='active'
       JOIN wpu_accounts proposer ON proposer.id=c.proposed_by
       WHERE EXISTS (SELECT 1 FROM wpu_role_assignments r WHERE r.account_id=a.id AND r.revoked_at IS NULL
         AND r.scope_type='organisation' AND r.scope_id=o.id
         AND (r.role='wpu_reviewer' OR (r.role='organisation_admin' AND o.status='verified')))
       ORDER BY CASE c.state WHEN 'awaiting_review' THEN 0 WHEN 'awaiting_player' THEN 1 ELSE 2 END,c.updated_at DESC,c.id
       LIMIT 51)
     SELECT c.*,
       (SELECT json_group_array(json_object('sequence',h.sequence,'kind',h.actor_kind,
         'actor',h.actor,'state',h.state,'reason',h.reason,'at',h.occurred_at))
        FROM (SELECT h.*,CASE WHEN h.actor_kind='player' THEN NULL ELSE p.display_name END AS actor
          FROM wpu_affiliation_audit h JOIN wpu_accounts a ON a.id=h.actor_account_id
          JOIN wpu_persons p ON p.id=a.person_id WHERE h.request_id=c.id ORDER BY h.sequence) h) AS history
     FROM scoped_cases c`, [account]);

  return {
    organisations: roles.filter(row => row.role === "organisation_admin").map(row => ({ id: String(row.id), name: String(row.name) })),
    hasMore: records.length > 50,
    cases: records.slice(0, 50).map((row): AffiliationCase => {
      const state = row.state as AffiliationState;
      const actions: AffiliationDecision[] = [];
      if (row.can_review === 1) {
        if (state === "approved") actions.push("revoke");
        if (row.verified === 1 && state === "awaiting_review") actions.push("approve");
        if (row.verified === 1 && (state === "awaiting_review" || state === "awaiting_player")) actions.push("reject");
      }
      return {
        id: String(row.id), organisation: String(row.name), playerCodeEnding: String(row.ending),
        state, updatedAt: String(row.updated_at), actions, history: JSON.parse(String(row.history)) as AffiliationCase["history"],
      };
    }),
  };
}

export async function proposeAffiliation(account: string, organisation: string, playerCode: string, reason: string) {
  const id = randomUUID();
  const rows = await queryD1(
    `INSERT INTO wpu_affiliation_requests(id,person_id,organisation_id,proposed_by,last_actor,last_reason)
     SELECT ?,pp.person_id,o.id,a.id,a.id,? FROM wpu_accounts a
     JOIN wpu_role_assignments r ON r.account_id=a.id AND r.revoked_at IS NULL
     JOIN wpu_organisations o ON o.id=r.scope_id AND o.status='verified'
     JOIN wpu_player_profiles pp ON pp.public_player_code=? AND pp.person_id<>a.person_id
     WHERE a.id=? AND a.status='active' AND o.id=? AND r.scope_type='organisation' AND r.role='organisation_admin'
       AND EXISTS(SELECT 1 FROM wpu_accounts player WHERE player.person_id=pp.person_id AND player.status='active')
       AND NOT EXISTS(SELECT 1 FROM wpu_memberships m WHERE m.person_id=pp.person_id AND m.organisation_id=o.id
         AND m.membership_type='organisation' AND m.status='active')
     ON CONFLICT(person_id,organisation_id) WHERE state IN ('awaiting_player','awaiting_review','approved') DO NOTHING
     RETURNING id`, [id, reason, playerCode, account, organisation]);
  return rows.length ? id : null;
}

export async function decideAffiliation(account: string, id: string, decision: AffiliationDecision, reason: string) {
  const transitions = {
    approve: { to: "approved", first: "awaiting_review", second: "awaiting_review" },
    reject: { to: "rejected", first: "awaiting_review", second: "awaiting_player" },
    revoke: { to: "revoked", first: "approved", second: "approved" },
  } as const;
  const { to, first, second } = transitions[decision];
  const rows = await queryD1(
    `UPDATE wpu_affiliation_requests SET state=?,last_actor=?,last_reason=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
     WHERE id=? AND state IN (?,?) AND EXISTS (
       SELECT 1 FROM wpu_accounts a JOIN wpu_role_assignments r ON r.account_id=a.id
       JOIN wpu_organisations o ON o.id=r.scope_id
       JOIN wpu_accounts p ON p.id=wpu_affiliation_requests.proposed_by
       WHERE a.id=? AND a.status='active' AND a.person_id<>p.person_id AND a.person_id<>wpu_affiliation_requests.person_id
         AND r.revoked_at IS NULL AND r.role='wpu_reviewer' AND r.scope_type='organisation'
         AND o.id=wpu_affiliation_requests.organisation_id AND (?='revoked' OR o.status='verified'))
     AND (?<>'approved' OR (EXISTS (SELECT 1 FROM wpu_accounts player WHERE
       player.person_id=wpu_affiliation_requests.person_id AND player.status='active')
       AND NOT EXISTS (SELECT 1 FROM wpu_memberships m WHERE
         m.person_id=wpu_affiliation_requests.person_id AND m.organisation_id=wpu_affiliation_requests.organisation_id
         AND m.status='active' AND m.membership_type='organisation')))
     RETURNING id`, [to, account, reason, id, first, second, account, to, to]);
  return rows.length === 1;
}

export async function affiliationInvitations(account: string): Promise<AffiliationInvitation[]> {
  const rows = await queryD1(
    `SELECT c.id,o.name,c.created_at FROM wpu_affiliation_requests c
     JOIN wpu_accounts a ON a.person_id=c.person_id AND a.status='active'
     JOIN wpu_organisations o ON o.id=c.organisation_id AND o.status='verified'
     WHERE a.id=? AND c.state='awaiting_player' ORDER BY c.created_at,c.id LIMIT 50`, [account]);
  return rows.map(row => ({ id: String(row.id), organisation: String(row.name), createdAt: String(row.created_at) }));
}

export async function respondToAffiliation(account: string, id: string, accept: boolean) {
  const rows = await queryD1(
    `UPDATE wpu_affiliation_requests SET state=?,last_actor=?,last_reason=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
     WHERE id=? AND state='awaiting_player'
     AND EXISTS(SELECT 1 FROM wpu_accounts a WHERE a.id=? AND a.person_id=wpu_affiliation_requests.person_id AND a.status='active')
     AND EXISTS(SELECT 1 FROM wpu_organisations o WHERE o.id=wpu_affiliation_requests.organisation_id AND o.status='verified')
     RETURNING id`,
    [accept ? "awaiting_review" : "declined", account, accept ? "Player consented in their Passport." : "Player declined in their Passport.", id, account]);
  return rows.length === 1;
}
