-- Identity schema fixture, run against isolated local D1 after migration.
PRAGMA foreign_keys=ON;
INSERT INTO wpu_persons(id,display_name,country_code) VALUES('person-a','Test Player','SG');
INSERT INTO wpu_accounts(id,person_id,auth_subject) VALUES('account-a','person-a','test-provider|person-a');
INSERT INTO wpu_player_profiles(person_id,public_player_code) VALUES('person-a','WPU-TEST-0001');
INSERT INTO wpu_memberships(id,person_id,membership_type,status) VALUES('membership-a','person-a','individual','active');
INSERT INTO wpu_role_assignments(id,account_id,role,scope_type) VALUES('role-a','account-a','member','global');
INSERT INTO wpu_identity_audit(id,actor_account_id,subject_person_id,action) VALUES('audit-a','account-a','person-a','identity.created');
SELECT CASE WHEN
 (SELECT COUNT(*) FROM wpu_persons WHERE id='person-a')=1 AND
 (SELECT COUNT(*) FROM wpu_accounts WHERE person_id='person-a')=1 AND
 (SELECT COUNT(*) FROM wpu_player_profiles WHERE person_id='person-a')=1 AND
 (SELECT COUNT(*) FROM wpu_memberships WHERE person_id='person-a' AND status='active')=1 AND
 (SELECT COUNT(*) FROM wpu_role_assignments WHERE account_id='account-a' AND role='member')=1 AND
 (SELECT COUNT(*) FROM wpu_identity_audit WHERE subject_person_id='person-a')=1
THEN 'IDENTITY_FIXTURE_PASS' ELSE 'IDENTITY_FIXTURE_FAIL' END AS result;

-- Duplicate active membership and role grants must be rejected without failing fixture.
INSERT OR IGNORE INTO wpu_memberships(id,person_id,membership_type,status)
VALUES('membership-duplicate','person-a','individual','active');
INSERT OR IGNORE INTO wpu_role_assignments(id,account_id,role,scope_type)
VALUES('role-duplicate','account-a','member','global');
SELECT CASE WHEN
 (SELECT COUNT(*) FROM wpu_memberships WHERE person_id='person-a' AND membership_type='individual' AND status='active')=1
 AND (SELECT COUNT(*) FROM wpu_role_assignments WHERE account_id='account-a' AND role='member' AND scope_type='global' AND revoked_at IS NULL)=1
THEN 'IDENTITY_INVARIANTS_PASS' ELSE 'IDENTITY_INVARIANTS_FAIL' END AS result;

-- Privacy default and deferred DOB are mandatory registration invariants.
SELECT CASE WHEN
 (SELECT visibility FROM wpu_player_profiles WHERE person_id='person-a')='private'
 AND (SELECT birth_date FROM wpu_persons WHERE id='person-a') IS NULL
THEN 'REGISTRATION_PRIVACY_PASS' ELSE 'REGISTRATION_PRIVACY_FAIL' END AS result;

-- Passwordless persistence fixture (synthetic hashes only).
INSERT INTO wpu_auth_emails(account_id,email_normalized,verified_at)
VALUES('account-a','test@example.org',datetime('now'));
INSERT INTO wpu_auth_challenges(id,email_normalized,secret_hash,purpose,expires_at)
VALUES('challenge-a','test@example.org','synthetic-hash-a','signin',datetime('now','+10 minutes'));
INSERT INTO wpu_auth_sessions(id,account_id,session_hash,expires_at)
VALUES('session-a','account-a','synthetic-session-hash-a',datetime('now','+1 day'));
SELECT CASE WHEN
 (SELECT COUNT(*) FROM wpu_auth_emails WHERE account_id='account-a' AND verified_at IS NOT NULL)=1
 AND (SELECT COUNT(*) FROM wpu_auth_challenges WHERE purpose='signin' AND consumed_at IS NULL)=1
 AND (SELECT COUNT(*) FROM wpu_auth_sessions WHERE account_id='account-a' AND revoked_at IS NULL)=1
THEN 'PASSWORDLESS_SCHEMA_PASS' ELSE 'PASSWORDLESS_SCHEMA_FAIL' END AS result;
