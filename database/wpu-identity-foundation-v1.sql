-- WPU identity foundation v1. Additive; no changes to existing supporter tables.
-- Run on isolated D1 first. Do not apply to production until deployment/binding verified.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS wpu_persons (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL CHECK(length(trim(display_name)) BETWEEN 1 AND 160),
  country_code TEXT CHECK(country_code IS NULL OR length(country_code)=2),
  birth_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wpu_accounts (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES wpu_persons(id) ON DELETE RESTRICT,
  auth_subject TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wpu_accounts_person ON wpu_accounts(person_id);

CREATE TABLE IF NOT EXISTS wpu_player_profiles (
  person_id TEXT PRIMARY KEY REFERENCES wpu_persons(id) ON DELETE RESTRICT,
  public_player_code TEXT NOT NULL UNIQUE,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('public','private')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wpu_organisations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 200),
  country_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','suspended')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wpu_memberships (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES wpu_persons(id) ON DELETE RESTRICT,
  organisation_id TEXT REFERENCES wpu_organisations(id) ON DELETE RESTRICT,
  membership_type TEXT NOT NULL CHECK(membership_type IN ('individual','organisation')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','suspended','expired','revoked')),
  valid_from TEXT,
  valid_until TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK(membership_type='individual' OR organisation_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_wpu_memberships_person ON wpu_memberships(person_id,status);

CREATE TABLE IF NOT EXISTS wpu_role_assignments (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wpu_accounts(id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK(role IN ('member','organiser','organisation_admin','wpu_reviewer','wpu_admin')),
  scope_type TEXT NOT NULL CHECK(scope_type IN ('global','organisation','tournament')),
  scope_id TEXT,
  granted_by_account_id TEXT REFERENCES wpu_accounts(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT,
  CHECK((scope_type='global' AND scope_id IS NULL) OR (scope_type!='global' AND scope_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_wpu_roles_account ON wpu_role_assignments(account_id,revoked_at);

CREATE TABLE IF NOT EXISTS wpu_identity_audit (
  id TEXT PRIMARY KEY,
  actor_account_id TEXT REFERENCES wpu_accounts(id) ON DELETE RESTRICT,
  subject_person_id TEXT REFERENCES wpu_persons(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  reason TEXT,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wpu_identity_audit_subject ON wpu_identity_audit(subject_person_id,occurred_at);
