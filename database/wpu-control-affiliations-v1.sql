-- Additive WPU Control pilot. Does not modify existing accounts, roles or Player IDs.
-- Apply only after the six membership migrations and pilot migration review.
CREATE TABLE wpu_affiliation_requests (
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES wpu_persons(id),
  organisation_id TEXT NOT NULL REFERENCES wpu_organisations(id),
  proposed_by TEXT NOT NULL REFERENCES wpu_accounts(id),
  state TEXT NOT NULL DEFAULT 'awaiting_player' CHECK(state IN (
    'awaiting_player','awaiting_review','declined','approved','rejected','revoked'
  )),
  last_actor TEXT NOT NULL REFERENCES wpu_accounts(id),
  last_reason TEXT NOT NULL CHECK(length(trim(last_reason)) BETWEEN 1 AND 500),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX ux_wpu_affiliation_open_pair
ON wpu_affiliation_requests(person_id,organisation_id)
WHERE state IN ('awaiting_player','awaiting_review','approved');
CREATE INDEX idx_wpu_affiliation_org_queue ON wpu_affiliation_requests(organisation_id,updated_at);
CREATE INDEX idx_wpu_affiliation_player_queue ON wpu_affiliation_requests(person_id,updated_at);

CREATE TABLE wpu_affiliation_audit (
  sequence INTEGER PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES wpu_affiliation_requests(id),
  actor_account_id TEXT NOT NULL REFERENCES wpu_accounts(id),
  actor_kind TEXT NOT NULL CHECK(actor_kind IN ('operator','player','reviewer')),
  previous_state TEXT,
  state TEXT NOT NULL,
  reason TEXT NOT NULL,
  occurred_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_wpu_affiliation_audit_request ON wpu_affiliation_audit(request_id,sequence);

CREATE TRIGGER wpu_affiliation_proposal_guard BEFORE INSERT ON wpu_affiliation_requests
BEGIN
  SELECT CASE WHEN NEW.state<>'awaiting_player' OR NEW.proposed_by<>NEW.last_actor
    OR NOT EXISTS (SELECT 1 FROM wpu_accounts a JOIN wpu_role_assignments r ON r.account_id=a.id
      JOIN wpu_organisations o ON o.id=r.scope_id
      WHERE a.id=NEW.proposed_by AND a.status='active' AND a.person_id<>NEW.person_id
        AND r.revoked_at IS NULL AND r.role='organisation_admin' AND r.scope_type='organisation'
        AND o.id=NEW.organisation_id AND o.status='verified')
    OR NOT EXISTS (SELECT 1 FROM wpu_accounts a JOIN wpu_player_profiles p ON p.person_id=a.person_id
      WHERE a.person_id=NEW.person_id AND a.status='active')
    OR EXISTS (SELECT 1 FROM wpu_memberships m WHERE m.person_id=NEW.person_id
      AND m.organisation_id=NEW.organisation_id AND m.membership_type='organisation' AND m.status='active')
    THEN RAISE(ABORT,'affiliation proposal invalid') END;
END;

CREATE TRIGGER wpu_affiliation_transition_guard BEFORE UPDATE ON wpu_affiliation_requests
BEGIN
  SELECT CASE WHEN NEW.id<>OLD.id OR NEW.person_id<>OLD.person_id
    OR NEW.organisation_id<>OLD.organisation_id OR NEW.proposed_by<>OLD.proposed_by
    OR NEW.created_at<>OLD.created_at OR NOT (
      (OLD.state='awaiting_player' AND NEW.state IN ('awaiting_review','declined')
        AND EXISTS (SELECT 1 FROM wpu_accounts a WHERE a.id=NEW.last_actor
          AND a.status='active' AND a.person_id=OLD.person_id))
      OR
      (((OLD.state='awaiting_review' AND NEW.state IN ('approved','rejected'))
        OR (OLD.state='awaiting_player' AND NEW.state='rejected')
        OR (OLD.state='approved' AND NEW.state='revoked'))
        AND EXISTS (SELECT 1 FROM wpu_accounts a JOIN wpu_role_assignments r ON r.account_id=a.id
          JOIN wpu_accounts p ON p.id=OLD.proposed_by
          JOIN wpu_organisations o ON o.id=r.scope_id
          WHERE a.id=NEW.last_actor AND a.status='active' AND a.person_id<>OLD.person_id
            AND a.person_id<>p.person_id AND r.revoked_at IS NULL AND r.role='wpu_reviewer'
            AND r.scope_type='organisation' AND o.id=OLD.organisation_id
            AND (NEW.state='revoked' OR o.status='verified'))
        AND (NEW.state<>'approved' OR EXISTS (SELECT 1 FROM wpu_accounts player
          WHERE player.person_id=OLD.person_id AND player.status='active')))
    ) THEN RAISE(ABORT,'affiliation transition invalid') END;
END;

CREATE TRIGGER wpu_affiliation_proposed AFTER INSERT ON wpu_affiliation_requests
BEGIN
  INSERT INTO wpu_affiliation_audit(request_id,actor_account_id,actor_kind,previous_state,state,reason)
  VALUES(NEW.id,NEW.last_actor,'operator',NULL,NEW.state,NEW.last_reason);
END;

CREATE TRIGGER wpu_affiliation_transitioned AFTER UPDATE ON wpu_affiliation_requests
BEGIN
  INSERT INTO wpu_affiliation_audit(request_id,actor_account_id,actor_kind,previous_state,state,reason)
  VALUES(NEW.id,NEW.last_actor,CASE WHEN NEW.state IN ('awaiting_review','declined')
    THEN 'player' ELSE 'reviewer' END,OLD.state,NEW.state,NEW.last_reason);
  INSERT INTO wpu_memberships(id,person_id,organisation_id,membership_type,status,valid_from)
  SELECT 'affiliation:'||NEW.id,NEW.person_id,NEW.organisation_id,'organisation','active',NEW.updated_at
  WHERE NEW.state='approved';
  UPDATE wpu_memberships SET status='revoked',valid_until=NEW.updated_at
  WHERE NEW.state='revoked' AND id='affiliation:'||NEW.id AND status='active';
  SELECT CASE WHEN NEW.state='revoked' AND changes()<>1
    THEN RAISE(ABORT,'affiliation membership unavailable') END;
END;

CREATE TRIGGER wpu_affiliation_requests_no_delete BEFORE DELETE ON wpu_affiliation_requests
BEGIN SELECT RAISE(ABORT,'affiliation requests are retained'); END;
CREATE TRIGGER wpu_affiliation_audit_no_update BEFORE UPDATE ON wpu_affiliation_audit
BEGIN SELECT RAISE(ABORT,'affiliation audit is append only'); END;
CREATE TRIGGER wpu_affiliation_audit_no_delete BEFORE DELETE ON wpu_affiliation_audit
BEGIN SELECT RAISE(ABORT,'affiliation audit is append only'); END;
