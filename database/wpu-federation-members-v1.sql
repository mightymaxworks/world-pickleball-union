-- Local federation administration data. No WPU identity or affiliation is changed.
CREATE TABLE wpu_federation_member_details (
 organisation_id TEXT NOT NULL REFERENCES wpu_federation_portals(organisation_id),
 person_id TEXT NOT NULL REFERENCES wpu_persons(id),
 membership_number TEXT COLLATE NOCASE CHECK(membership_number IS NULL OR length(membership_number) BETWEEN 1 AND 40),
 club TEXT CHECK(club IS NULL OR length(club) BETWEEN 1 AND 100),
 category TEXT CHECK(category IS NULL OR category IN ('player','coach','official','other')),
 joined_on TEXT CHECK(joined_on IS NULL OR length(joined_on)=10),
 renewal_on TEXT CHECK(renewal_on IS NULL OR length(renewal_on)=10),
 revision INTEGER NOT NULL CHECK(revision>=1),
 updated_at TEXT NOT NULL DEFAULT (datetime('now')),
 updated_by_account_id TEXT NOT NULL REFERENCES wpu_accounts(id),
 PRIMARY KEY(organisation_id,person_id),
 CHECK(joined_on IS NULL OR renewal_on IS NULL OR renewal_on>=joined_on)
);
CREATE UNIQUE INDEX idx_wpu_fed_local_membership_number
 ON wpu_federation_member_details(organisation_id,membership_number) WHERE membership_number IS NOT NULL;
ALTER TABLE wpu_federation_roster_events ADD COLUMN reason TEXT CHECK(reason IS NULL OR length(reason) BETWEEN 1 AND 240);
