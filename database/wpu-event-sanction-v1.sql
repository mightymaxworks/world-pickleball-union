-- Additive higher-tier review. Does not sanction existing publications or grant access.
CREATE TABLE wpu_event_sanction_requests (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES wpu_studio_events(id),
  division_id TEXT NOT NULL,
  requested_tier TEXT NOT NULL CHECK(requested_tier IN ('T1','T2','T3','T4')),
  basis_json TEXT NOT NULL CHECK(json_valid(basis_json)),
  evidence_json TEXT NOT NULL CHECK(json_valid(evidence_json)),
  submitted_by TEXT NOT NULL REFERENCES wpu_accounts(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','changes_requested')),
  decided_by TEXT REFERENCES wpu_accounts(id),
  decided_at TEXT,
  decision_note TEXT,
  CHECK(
    (status='pending' AND decided_by IS NULL AND decided_at IS NULL AND decision_note IS NULL) OR
    (status<>'pending' AND decided_by IS NOT NULL AND decided_at IS NOT NULL AND decision_note IS NOT NULL AND length(decision_note)<=500)
  ),
  CHECK(status<>'changes_requested' OR length(trim(decision_note))>0)
);
CREATE UNIQUE INDEX idx_wpu_event_sanction_pending ON wpu_event_sanction_requests(event_id,division_id,basis_json) WHERE status='pending';
CREATE INDEX idx_wpu_event_sanction_history ON wpu_event_sanction_requests(event_id,division_id,created_at);
CREATE INDEX idx_wpu_event_sanction_queue ON wpu_event_sanction_requests(status,created_at,id);
CREATE TRIGGER wpu_event_sanction_insert_pending BEFORE INSERT ON wpu_event_sanction_requests
WHEN NEW.status<>'pending' BEGIN SELECT RAISE(ABORT,'request must start pending'); END;
CREATE TRIGGER wpu_event_sanction_review_once BEFORE UPDATE ON wpu_event_sanction_requests
WHEN OLD.status<>'pending' OR NEW.status='pending' OR NEW.id IS NOT OLD.id OR NEW.event_id IS NOT OLD.event_id OR
  NEW.division_id IS NOT OLD.division_id OR NEW.requested_tier IS NOT OLD.requested_tier OR NEW.basis_json IS NOT OLD.basis_json OR
  NEW.evidence_json IS NOT OLD.evidence_json OR NEW.submitted_by IS NOT OLD.submitted_by OR NEW.created_at IS NOT OLD.created_at
BEGIN SELECT RAISE(ABORT,'review must preserve submission and decide only once'); END;
CREATE TRIGGER wpu_event_sanction_no_delete BEFORE DELETE ON wpu_event_sanction_requests
BEGIN SELECT RAISE(ABORT,'retain competition sanction history'); END;
