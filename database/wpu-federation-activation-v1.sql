-- Operational publishing only. No admission, representation, eligibility or external integration.
CREATE TABLE wpu_federation_publishers (
 account_id TEXT PRIMARY KEY REFERENCES wpu_accounts(id),
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 revoked_at TEXT
);
CREATE TABLE wpu_federation_activation_events (
 sequence INTEGER PRIMARY KEY,
 organisation_id TEXT NOT NULL REFERENCES wpu_organisations(id),
 slug TEXT NOT NULL CHECK(length(slug) BETWEEN 1 AND 63 AND slug NOT GLOB '*[^a-z0-9-]*'),
 state TEXT NOT NULL CHECK(state IN ('open','paused')),
 actor_account_id TEXT NOT NULL REFERENCES wpu_accounts(id),
 added_operator_account_id TEXT REFERENCES wpu_accounts(id),
 added_reviewer_account_id TEXT REFERENCES wpu_accounts(id),
 reason TEXT NOT NULL CHECK(length(trim(reason)) BETWEEN 3 AND 500),
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 CHECK(state='open' OR (added_operator_account_id IS NULL AND added_reviewer_account_id IS NULL))
);
CREATE INDEX idx_wpu_fed_activation_events ON wpu_federation_activation_events(organisation_id,sequence DESC);
CREATE TRIGGER wpu_fed_activation_publish
AFTER INSERT ON wpu_federation_activation_events WHEN NEW.state='open'
BEGIN
 UPDATE wpu_organisations SET status='verified' WHERE id=NEW.organisation_id AND status='pending';
 INSERT INTO wpu_federation_portals(slug,organisation_id,enabled)
 VALUES(NEW.slug,NEW.organisation_id,1)
 ON CONFLICT(organisation_id) DO UPDATE SET enabled=1;
 INSERT INTO wpu_affiliation_self_request_orgs(organisation_id) VALUES(NEW.organisation_id)
 ON CONFLICT(organisation_id) DO NOTHING;
 INSERT INTO wpu_role_assignments(id,account_id,role,scope_type,scope_id,granted_by_account_id)
 SELECT 'activation:operator:'||NEW.sequence,NEW.added_operator_account_id,'organisation_admin','organisation',NEW.organisation_id,NEW.actor_account_id
 WHERE NEW.added_operator_account_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM wpu_role_assignments r WHERE r.account_id=NEW.added_operator_account_id AND r.role='organisation_admin'
   AND r.scope_type='organisation' AND r.scope_id=NEW.organisation_id AND r.revoked_at IS NULL);
 INSERT INTO wpu_role_assignments(id,account_id,role,scope_type,scope_id,granted_by_account_id)
 SELECT 'activation:reviewer:'||NEW.sequence,NEW.added_reviewer_account_id,'wpu_reviewer','organisation',NEW.organisation_id,NEW.actor_account_id
 WHERE NEW.added_reviewer_account_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM wpu_role_assignments r WHERE r.account_id=NEW.added_reviewer_account_id AND r.role='wpu_reviewer'
   AND r.scope_type='organisation' AND r.scope_id=NEW.organisation_id AND r.revoked_at IS NULL);
END;
CREATE TRIGGER wpu_fed_activation_events_no_update BEFORE UPDATE ON wpu_federation_activation_events
BEGIN SELECT RAISE(ABORT,'federation activation history is append only'); END;
CREATE TRIGGER wpu_fed_activation_events_no_delete BEFORE DELETE ON wpu_federation_activation_events
BEGIN SELECT RAISE(ABORT,'federation activation history is append only'); END;
-- An older Worker cannot reopen new player requests during a rollback.
CREATE TRIGGER wpu_fed_activation_pause_guard BEFORE INSERT ON wpu_affiliation_requests
WHEN NEW.request_source='player' AND (SELECT state FROM wpu_federation_activation_events
 WHERE organisation_id=NEW.organisation_id ORDER BY sequence DESC LIMIT 1)='paused'
BEGIN SELECT RAISE(ABORT,'new federation affiliation requests are paused'); END;
