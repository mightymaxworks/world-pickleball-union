-- Additive. Apply after wpu-control-affiliations-v2 on the verified WPU D1 binding.
-- This migration registers no organisations, grants no roles and enables no clients.
CREATE TABLE IF NOT EXISTS wpu_federation_portals (
 slug TEXT PRIMARY KEY CHECK(length(slug) BETWEEN 1 AND 63 AND slug NOT GLOB '*[^a-z0-9-]*'),
 organisation_id TEXT NOT NULL UNIQUE REFERENCES wpu_organisations(id),
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1))
);
CREATE TABLE IF NOT EXISTS wpu_federation_roster_events (
 sequence INTEGER PRIMARY KEY,
 membership_id TEXT NOT NULL REFERENCES wpu_memberships(id),
 actor_account_id TEXT NOT NULL REFERENCES wpu_accounts(id),
 roster_status TEXT NOT NULL CHECK(roster_status IN ('listed','on_hold')),
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wpu_roster_membership_sequence ON wpu_federation_roster_events(membership_id, sequence DESC);
CREATE INDEX IF NOT EXISTS idx_wpu_memberships_roster ON wpu_memberships(organisation_id,status,id);
CREATE TABLE IF NOT EXISTS wpu_federation_identity_clients (
 id TEXT PRIMARY KEY,
 organisation_id TEXT NOT NULL REFERENCES wpu_federation_portals(organisation_id),
 label TEXT NOT NULL CHECK(length(trim(label)) BETWEEN 1 AND 160),
 key_hash TEXT NOT NULL CHECK(length(key_hash)=64),
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1))
);
CREATE TABLE IF NOT EXISTS wpu_federation_identity_grants (
 grant_hash TEXT PRIMARY KEY CHECK(length(grant_hash)=64),
 client_id TEXT NOT NULL REFERENCES wpu_federation_identity_clients(id),
 membership_id TEXT NOT NULL REFERENCES wpu_memberships(id),
 account_id TEXT NOT NULL REFERENCES wpu_accounts(id),
 expires_at TEXT NOT NULL,
 UNIQUE(client_id,membership_id)
);
