-- Staff review is separate from membership, recognition, organisation activation and portal access.
CREATE TABLE wpu_organisation_intake_reviewers (
 account_id TEXT PRIMARY KEY REFERENCES wpu_accounts(id),
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 revoked_at TEXT
);
CREATE TABLE wpu_organisation_intake_events (
 sequence INTEGER PRIMARY KEY,
 inquiry_id TEXT NOT NULL REFERENCES wpu_inquiries(id),
 reviewer_account_id TEXT NOT NULL REFERENCES wpu_accounts(id),
 decision TEXT NOT NULL CHECK(decision IN ('follow_up','approve_existing','approve_new','close')),
 reason TEXT NOT NULL CHECK(length(trim(reason)) BETWEEN 3 AND 500),
 organisation_id TEXT REFERENCES wpu_organisations(id),
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 CHECK((organisation_id IS NOT NULL)=(decision IN ('approve_existing','approve_new')))
);
CREATE INDEX idx_wpu_intake_events ON wpu_organisation_intake_events(inquiry_id,sequence DESC);
CREATE UNIQUE INDEX idx_wpu_intake_final_decision ON wpu_organisation_intake_events(inquiry_id) WHERE decision<>'follow_up';
CREATE TRIGGER wpu_intake_events_no_update BEFORE UPDATE ON wpu_organisation_intake_events
BEGIN SELECT RAISE(ABORT,'intake history is append only'); END;
CREATE TRIGGER wpu_intake_events_no_delete BEFORE DELETE ON wpu_organisation_intake_events
BEGIN SELECT RAISE(ABORT,'intake history is append only'); END;
