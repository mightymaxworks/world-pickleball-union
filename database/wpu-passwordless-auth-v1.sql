-- WPU passwordless authentication persistence v1.
-- Store only SHA-256 or stronger keyed hashes of random verification secrets, never raw codes/links.
-- Do not enable auth endpoints until secure mail delivery, throttling, and server-side session handling exist.
CREATE TABLE IF NOT EXISTS wpu_auth_emails (
  account_id TEXT NOT NULL REFERENCES wpu_accounts(id) ON DELETE RESTRICT,
  email_normalized TEXT NOT NULL UNIQUE,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(account_id,email_normalized)
);
CREATE TABLE IF NOT EXISTS wpu_auth_challenges (
  id TEXT PRIMARY KEY,
  email_normalized TEXT NOT NULL,
  secret_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK(purpose IN ('signin','verify_email')),
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wpu_auth_challenge_email ON wpu_auth_challenges(email_normalized,created_at);
CREATE TABLE IF NOT EXISTS wpu_auth_sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wpu_accounts(id) ON DELETE RESTRICT,
  session_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wpu_auth_session_account ON wpu_auth_sessions(account_id,revoked_at);
