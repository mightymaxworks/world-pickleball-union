import { randomUUID } from "node:crypto";
import { queryD1 } from "@/lib/supporters-db";
import { onlineRequestCondition } from "@/lib/federations/availability";
import type { AffiliationCase, AffiliationDecision, AffiliationInvitation, AffiliationState, PlayerAffiliationWorkspace } from "./types";

export async function affiliationWorkspace(account: string) {
  const roles = await queryD1(
    `SELECT o.id,o.name,r.role FROM wpu_role_assignments r JOIN wpu_organisations o ON o.id=r.scope_id
     JOIN wpu_accounts a ON a.id=r.account_id AND a.status='active'
     WHERE r.account_id=? AND r.scope_type='organisation' AND r.revoked_at IS NULL
       AND (r.role='wpu_reviewer' OR (r.role='organisation_admin' AND o.status='verified'
         AND NOT EXISTS (SELECT 1 FROM wpu_affiliation_self_request_orgs pilot WHERE pilot.organisation_id=o.id)))
     ORDER BY o.name,o.id`, [account]);
  if (!roles.length) return null;

  const records = await queryD1(
    `WITH scoped_cases AS (
       SELECT c.id,c.state,c.request_source,c.updated_at,o.name,player.display_name AS player_name,substr(pp.public_player_code,-8) AS ending,
        EXISTS (SELECT 1 FROM wpu_role_assignments r
          WHERE r.account_id=a.id AND r.revoked_at IS NULL AND r.role='wpu_reviewer'
            AND r.scope_type='organisation' AND r.scope_id=o.id
            AND a.person_id<>c.person_id AND a.person_id<>proposer.person_id) AS can_review,
        o.status='verified' AS verified
       FROM wpu_affiliation_requests c JOIN wpu_organisations o ON o.id=c.organisation_id
       JOIN wpu_player_profiles pp ON pp.person_id=c.person_id
       JOIN wpu_persons player ON player.id=c.person_id
       JOIN wpu_accounts a ON a.id=? AND a.status='active'
       JOIN wpu_accounts proposer ON proposer.id=c.proposed_by
       WHERE EXISTS (SELECT 1 FROM wpu_role_assignments r WHERE r.account_id=a.id AND r.revoked_at IS NULL
         AND r.scope_type='organisation' AND r.scope_id=o.id
         AND (r.role='wpu_reviewer' OR (r.role='organisation_admin' AND o.status='verified' AND c.request_source='operator')))
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
        state, source: row.request_source as AffiliationCase["source"],
        playerName: row.can_review === 1 && row.request_source === "player" ? String(row.player_name) : null,
        updatedAt: String(row.updated_at), actions, history: JSON.parse(String(row.history)) as AffiliationCase["history"],
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
       AND NOT EXISTS(SELECT 1 FROM wpu_affiliation_self_request_orgs pilot WHERE pilot.organisation_id=o.id)
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

async function affiliationInvitations(account: string): Promise<AffiliationInvitation[]> {
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


/** The signed-in account is the only possible subject of a player request. */
export async function requestOwnAffiliation(account: string, organisation: string) {
  const id = randomUUID();
  const requestsOpen = await onlineRequestCondition();
  const rows = await queryD1(
    `INSERT INTO wpu_affiliation_requests(id,person_id,organisation_id,proposed_by,last_actor,last_reason,state,request_source)
     SELECT ?,a.person_id,o.id,a.id,a.id,'Player requested affiliation from their Passport.','awaiting_review','player'
     FROM wpu_accounts a JOIN wpu_player_profiles pp ON pp.person_id=a.person_id
     JOIN wpu_affiliation_self_request_orgs pilot ON pilot.organisation_id=?
     JOIN wpu_organisations o ON o.id=pilot.organisation_id AND o.status='verified'
     WHERE a.id=? AND a.status='active' AND ${requestsOpen}
       AND EXISTS(SELECT 1 FROM wpu_auth_emails e WHERE e.account_id=a.id AND e.verified_at IS NOT NULL)
       AND NOT EXISTS(SELECT 1 FROM wpu_memberships m WHERE m.person_id=a.person_id AND m.organisation_id=o.id
         AND m.membership_type='organisation' AND m.status='active')
     ON CONFLICT(person_id,organisation_id) WHERE state IN ('awaiting_player','awaiting_review','approved') DO NOTHING
     RETURNING id`, [id, organisation, account]);
  return rows.length ? id : null;
}

export async function playerAffiliationWorkspace(account: string): Promise<PlayerAffiliationWorkspace> {
  const requestsOpen = await onlineRequestCondition();
  const [invitations, options, requests] = await Promise.all([
    affiliationInvitations(account),
    queryD1(
      `SELECT o.id,o.name FROM wpu_affiliation_self_request_orgs pilot
       JOIN wpu_organisations o ON o.id=pilot.organisation_id AND o.status='verified'
       JOIN wpu_accounts a ON a.id=? AND a.status='active'
       JOIN wpu_player_profiles pp ON pp.person_id=a.person_id
       WHERE ${requestsOpen} AND EXISTS(SELECT 1 FROM wpu_auth_emails e WHERE e.account_id=a.id AND e.verified_at IS NOT NULL)
         AND NOT EXISTS(SELECT 1 FROM wpu_affiliation_requests c WHERE c.person_id=a.person_id
           AND c.organisation_id=o.id AND c.state IN ('awaiting_player','awaiting_review','approved'))
         AND NOT EXISTS(SELECT 1 FROM wpu_memberships m WHERE m.person_id=a.person_id AND m.organisation_id=o.id
           AND m.membership_type='organisation' AND m.status='active')
       ORDER BY o.name,o.id LIMIT 50`, [account]),
    queryD1(
      `SELECT c.id,c.state,o.name FROM wpu_affiliation_requests c
       JOIN wpu_accounts a ON a.person_id=c.person_id AND a.status='active'
       JOIN wpu_organisations o ON o.id=c.organisation_id
       WHERE a.id=? AND c.request_source='player'
       ORDER BY CASE c.state WHEN 'awaiting_review' THEN 0 ELSE 1 END,c.updated_at DESC,c.id LIMIT 50`, [account]),
  ]);
  return {
    invitations,
    options: options.map(row => ({ id: String(row.id), name: String(row.name) })),
    requests: requests.map(row => ({ id: String(row.id), state: row.state as AffiliationState, organisation: String(row.name) })),
  };
}
