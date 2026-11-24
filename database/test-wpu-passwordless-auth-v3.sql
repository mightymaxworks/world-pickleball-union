-- Synthetic new and returning player transactions.
INSERT INTO wpu_auth_challenges(id,email_normalized,secret_hash,purpose,expires_at,delivered_at,attempt_count)
VALUES('new-c','player@example.org','digest-new','signin','2099-01-01T00:00:00.000Z',datetime('now'),1);
INSERT INTO wpu_verified_signup_grants(challenge_id,email_normalized,person_id,account_id,player_code,display_name,country_code,consent_version,session_id,session_hash,session_expires_at)
VALUES('new-c','player@example.org','person-new','account-new','WPU-SYNTHETIC-NEW','Synthetic Player','BT','wpu-registration-v1','session-new','digest-session-new','2099-01-01T00:00:00.000Z');
INSERT INTO wpu_auth_challenges(id,email_normalized,secret_hash,purpose,expires_at,delivered_at,attempt_count)
VALUES('return-c','player@example.org','digest-return','signin','2099-01-01T00:00:00.000Z',datetime('now'),1);
INSERT INTO wpu_verified_signup_grants(challenge_id,email_normalized,person_id,account_id,player_code,display_name,country_code,consent_version,session_id,session_hash,session_expires_at)
VALUES('return-c','player@example.org','person-unused','account-unused','WPU-UNUSED','Returning member','ZZ','returning-login','session-return','digest-session-return','2099-01-01T00:00:00.000Z');
SELECT CASE WHEN
 (SELECT count(*) FROM wpu_persons)=1 AND
 (SELECT count(*) FROM wpu_accounts)=1 AND
 (SELECT count(*) FROM wpu_auth_sessions WHERE account_id='account-new')=2 AND
 (SELECT public_player_code FROM wpu_player_profiles WHERE person_id='person-new')='WPU-SYNTHETIC-NEW' AND
 (SELECT visibility FROM wpu_player_profiles WHERE person_id='person-new')='private' AND
 (SELECT birth_date FROM wpu_persons WHERE id='person-new') IS NULL AND
 (SELECT country_code FROM wpu_persons WHERE id='person-new')='BT' AND
 (SELECT count(*) FROM wpu_memberships WHERE person_id='person-new' AND organisation_id IS NULL AND status='active')=1 AND
 (SELECT count(*) FROM wpu_auth_challenges WHERE consumed_at IS NOT NULL)=2
 THEN 'PROVISIONING_PASS' ELSE 'PROVISIONING_FAIL' END AS result;
