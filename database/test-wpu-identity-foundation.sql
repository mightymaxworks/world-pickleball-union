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
