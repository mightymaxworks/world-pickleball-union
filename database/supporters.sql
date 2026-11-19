-- Apply to the WPU Cloudflare D1 database before enabling pledge submissions.
CREATE TABLE IF NOT EXISTS supporter_pledges (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 country TEXT NOT NULL,
 region TEXT NOT NULL,
 category TEXT NOT NULL,
 website TEXT NOT NULL,
 representative TEXT NOT NULL,
 email TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 authority_confirmed INTEGER NOT NULL,
 publication_consent INTEGER NOT NULL,
 created_at TEXT NOT NULL,
 reviewed_at TEXT,
 reviewed_by TEXT,
 review_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_supporter_status ON supporter_pledges(status,created_at);
