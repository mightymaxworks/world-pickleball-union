CREATE TABLE IF NOT EXISTS wpu_inquiries (
 id TEXT PRIMARY KEY,
 form_type TEXT NOT NULL CHECK(form_type IN ('membership','competition')),
 organisation TEXT NOT NULL,
 country TEXT NOT NULL,
 contact_name TEXT NOT NULL,
 email TEXT NOT NULL,
 details_json TEXT NOT NULL,
 consent INTEGER NOT NULL DEFAULT 1,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewed','closed')),
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wpu_inquiries_queue ON wpu_inquiries(form_type,status,created_at);
