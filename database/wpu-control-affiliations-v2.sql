-- Add player-initiated requests without enabling any organisation or changing existing identities.
-- Apply after wpu-control-affiliations-v1.sql. Existing cases retain their operator source.
CREATE TABLE wpu_affiliation_self_request_orgs (
  organisation_id TEXT PRIMARY KEY NOT NULL REFERENCES wpu_organisations(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

ALTER TABLE wpu_affiliation_requests ADD COLUMN request_source TEXT NOT NULL DEFAULT 'operator'
  CHECK(request_source IN ('operator','player'));

DROP TRIGGER wpu_affiliation_proposal_guard;
CREATE TRIGGER wpu_affiliation_proposal_guard BEFORE INSERT ON wpu_affiliation_requests
BEGIN
  SELECT CASE WHEN NEW.proposed_by<>NEW.last_actor
    OR NOT EXISTS (SELECT 1 FROM wpu_accounts a JOIN wpu_player_profiles p ON p.person_id=a.person_id
      WHERE a.person_id=NEW.person_id AND a.status='active')
    OR EXISTS (SELECT 1 FROM wpu_memberships m WHERE m.person_id=NEW.person_id
      AND m.organisation_id=NEW.organisation_id AND m.membership_type='organisation' AND m.status='active')
    OR NOT EXISTS (SELECT 1 FROM wpu_organisations o WHERE o.id=NEW.organisation_id AND o.status='verified')
    OR NOT (
      (NEW.request_source='operator' AND NEW.state='awaiting_player'
        AND NOT EXISTS (SELECT 1 FROM wpu_affiliation_self_request_orgs pilot WHERE pilot.organisation_id=NEW.organisation_id)
        AND EXISTS (SELECT 1 FROM wpu_accounts a JOIN wpu_role_assignments r ON r.account_id=a.id
          WHERE a.id=NEW.proposed_by AND a.status='active' AND a.person_id<>NEW.person_id
            AND r.revoked_at IS NULL AND r.role='organisation_admin' AND r.scope_type='organisation'
            AND r.scope_id=NEW.organisation_id))
      OR
      (NEW.request_source='player' AND NEW.state='awaiting_review'
        AND EXISTS (SELECT 1 FROM wpu_affiliation_self_request_orgs pilot WHERE pilot.organisation_id=NEW.organisation_id)
        AND EXISTS (SELECT 1 FROM wpu_accounts a JOIN wpu_auth_emails e ON e.account_id=a.id
          WHERE a.id=NEW.proposed_by AND a.status='active' AND a.person_id=NEW.person_id AND e.verified_at IS NOT NULL))
    ) THEN RAISE(ABORT,'affiliation proposal invalid') END;
END;

DROP TRIGGER wpu_affiliation_proposed;
CREATE TRIGGER wpu_affiliation_proposed AFTER INSERT ON wpu_affiliation_requests
BEGIN
  INSERT INTO wpu_affiliation_audit(request_id,actor_account_id,actor_kind,previous_state,state,reason)
  VALUES(NEW.id,NEW.last_actor,NEW.request_source,NULL,NEW.state,NEW.last_reason);
END;

CREATE TRIGGER wpu_affiliation_source_immutable BEFORE UPDATE OF request_source ON wpu_affiliation_requests
WHEN NEW.request_source<>OLD.request_source
BEGIN SELECT RAISE(ABORT,'affiliation request source is immutable'); END;
