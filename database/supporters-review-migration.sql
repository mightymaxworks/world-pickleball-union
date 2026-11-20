-- Review workflow extension. Apply before enabling automatic approval.
ALTER TABLE supporter_pledges ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE supporter_pledges ADD COLUMN review_reason TEXT;
ALTER TABLE supporter_pledges ADD COLUMN policy_version TEXT;
CREATE TABLE IF NOT EXISTS supporter_audit (
 id TEXT PRIMARY KEY,
 pledge_id TEXT NOT NULL,
 action TEXT NOT NULL,
 actor TEXT NOT NULL,
 reason TEXT,
 policy_version TEXT,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_supporter_audit_pledge ON supporter_audit(pledge_id,created_at);
