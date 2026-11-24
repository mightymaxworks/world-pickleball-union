-- Atomic verified identity provisioning: trigger runs in the same transaction as grant insertion.
-- Apply after auth v2 and identity invariants v1. No production execution implied.
ALTER TABLE wpu_persons ADD COLUMN given_name TEXT;
ALTER TABLE wpu_persons ADD COLUMN family_name TEXT;
ALTER TABLE wpu_persons ADD COLUMN residence_locality TEXT;
ALTER TABLE wpu_persons ADD COLUMN gender TEXT CHECK(gender IS NULL OR gender IN ('male','female'));
CREATE TABLE wpu_verified_signup_grants (
 gender TEXT CHECK(gender IS NULL OR gender IN ('male','female')),
 given_name TEXT,
 family_name TEXT,
 residence_locality TEXT,
 challenge_id TEXT PRIMARY KEY REFERENCES wpu_auth_challenges(id),
 email_normalized TEXT NOT NULL,
 person_id TEXT NOT NULL,
 account_id TEXT NOT NULL,
 player_code TEXT NOT NULL,
 display_name TEXT NOT NULL,
 country_code TEXT NOT NULL,
 consent_version TEXT NOT NULL,
 session_id TEXT NOT NULL UNIQUE,
 session_hash TEXT NOT NULL UNIQUE,
 session_expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE wpu_registration_consents (
 person_id TEXT NOT NULL REFERENCES wpu_persons(id),
 policy_version TEXT NOT NULL,
 accepted_at TEXT NOT NULL DEFAULT (datetime('now')),
 challenge_id TEXT NOT NULL UNIQUE REFERENCES wpu_auth_challenges(id),
 PRIMARY KEY(person_id,policy_version)
);
CREATE TRIGGER wpu_provision_verified_signup AFTER INSERT ON wpu_verified_signup_grants
BEGIN
 SELECT CASE WHEN NOT EXISTS (
 SELECT 1 FROM wpu_auth_challenges WHERE id=NEW.challenge_id AND email_normalized=NEW.email_normalized
 AND consumed_at IS NULL AND delivered_at IS NOT NULL AND purpose='signin'
 AND julianday(expires_at)>julianday('now') AND attempt_count BETWEEN 1 AND 5
 ) THEN RAISE(ABORT,'invalid challenge') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM wpu_auth_emails WHERE email_normalized=NEW.email_normalized)
 AND (NEW.consent_version<>'wpu-registration-v1' OR length(trim(NEW.display_name)) NOT BETWEEN 1 AND 160 OR NEW.country_code NOT GLOB '[A-Z][A-Z]' OR NEW.country_code='ZZ')
 THEN RAISE(ABORT,'registration details required') END;
 UPDATE wpu_auth_challenges SET consumed_at=datetime('now') WHERE id=NEW.challenge_id;
 INSERT INTO wpu_persons(id,display_name,country_code,given_name,family_name,residence_locality,gender)
 SELECT NEW.person_id,NEW.display_name,NEW.country_code,NEW.given_name,NEW.family_name,NEW.residence_locality,NEW.gender
 WHERE NOT EXISTS(SELECT 1 FROM wpu_auth_emails WHERE email_normalized=NEW.email_normalized);
 INSERT INTO wpu_accounts(id,person_id,auth_subject)
 SELECT NEW.account_id,NEW.person_id,'wpu:'||NEW.account_id
 WHERE NOT EXISTS(SELECT 1 FROM wpu_auth_emails WHERE email_normalized=NEW.email_normalized);
 INSERT INTO wpu_player_profiles(person_id,public_player_code)
 SELECT NEW.person_id,NEW.player_code WHERE EXISTS(SELECT 1 FROM wpu_accounts WHERE id=NEW.account_id);
 INSERT INTO wpu_memberships(id,person_id,membership_type,status,valid_from)
 SELECT NEW.account_id,NEW.person_id,'individual','active',datetime('now') WHERE EXISTS(SELECT 1 FROM wpu_accounts WHERE id=NEW.account_id);
 INSERT INTO wpu_role_assignments(id,account_id,role,scope_type)
 SELECT NEW.account_id,NEW.account_id,'member','global' WHERE EXISTS(SELECT 1 FROM wpu_accounts WHERE id=NEW.account_id);
 INSERT INTO wpu_auth_emails(account_id,email_normalized,verified_at)
 SELECT NEW.account_id,NEW.email_normalized,datetime('now') WHERE EXISTS(SELECT 1 FROM wpu_accounts WHERE id=NEW.account_id);
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM wpu_auth_emails e JOIN wpu_accounts a ON a.id=e.account_id WHERE e.email_normalized=NEW.email_normalized AND e.verified_at IS NOT NULL AND a.status='active') THEN RAISE(ABORT,'inactive account') END;
 INSERT INTO wpu_registration_consents(person_id,policy_version,challenge_id)
 SELECT NEW.person_id,NEW.consent_version,NEW.challenge_id
 WHERE EXISTS(SELECT 1 FROM wpu_accounts WHERE id=NEW.account_id AND person_id=NEW.person_id);
 INSERT INTO wpu_auth_sessions(id,account_id,session_hash,expires_at)
 SELECT NEW.session_id,e.account_id,NEW.session_hash,NEW.session_expires_at FROM wpu_auth_emails e WHERE e.email_normalized=NEW.email_normalized;
 INSERT INTO wpu_identity_audit(id,actor_account_id,subject_person_id,action,reason)
 SELECT NEW.challenge_id,a.id,a.person_id,'auth.verified',NEW.consent_version FROM wpu_auth_emails e JOIN wpu_accounts a ON a.id=e.account_id WHERE e.email_normalized=NEW.email_normalized;
 DELETE FROM wpu_verified_signup_grants WHERE challenge_id=NEW.challenge_id;
END;
