-- WPU-001 additive authentication abuse-control migration.
-- Apply after wpu-identity-foundation-v1.sql and wpu-passwordless-auth-v1.sql.
-- Existing challenges receive zero attempts.
ALTER TABLE wpu_auth_challenges ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count >= 0);
ALTER TABLE wpu_auth_challenges ADD COLUMN delivered_at TEXT;
CREATE INDEX IF NOT EXISTS idx_wpu_auth_challenge_active ON wpu_auth_challenges(email_normalized, expires_at, consumed_at);
-- Hashed identifiers only: never store raw IP addresses or email addresses here.
CREATE TABLE IF NOT EXISTS wpu_auth_rate_limits (
  key_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count >= 0),
  PRIMARY KEY(key_hash,window_start)
);
CREATE INDEX IF NOT EXISTS idx_wpu_auth_rate_limits_window ON wpu_auth_rate_limits(window_start);
