-- Run after identity v1, passwordless v1 and passwordless v2 migrations.
PRAGMA foreign_keys=ON;
INSERT INTO wpu_auth_rate_limits(key_hash,window_start,attempt_count) VALUES('email-hash',3600,1);
INSERT INTO wpu_auth_rate_limits(key_hash,window_start,attempt_count)
VALUES('email-hash',3600,1)
ON CONFLICT(key_hash,window_start) DO UPDATE SET attempt_count=attempt_count+1
WHERE attempt_count<2;
INSERT INTO wpu_auth_rate_limits(key_hash,window_start,attempt_count)
VALUES('email-hash',3600,1)
ON CONFLICT(key_hash,window_start) DO UPDATE SET attempt_count=attempt_count+1
WHERE attempt_count<2;
SELECT CASE WHEN (SELECT attempt_count FROM wpu_auth_rate_limits WHERE key_hash='email-hash' AND window_start=3600)=2
THEN 'RATE_LIMIT_PASS' ELSE 'RATE_LIMIT_FAIL' END AS result;

INSERT INTO wpu_auth_send_cooldowns(email_key_hash,next_allowed_at) VALUES('email-hash',1060);
INSERT INTO wpu_auth_send_cooldowns(email_key_hash,next_allowed_at)
VALUES('email-hash',1090)
ON CONFLICT(email_key_hash) DO UPDATE SET next_allowed_at=excluded.next_allowed_at
WHERE wpu_auth_send_cooldowns.next_allowed_at<=1030;
SELECT CASE WHEN (SELECT next_allowed_at FROM wpu_auth_send_cooldowns WHERE email_key_hash='email-hash')=1060
THEN 'COOLDOWN_REJECT_PASS' ELSE 'COOLDOWN_REJECT_FAIL' END AS result;
INSERT INTO wpu_auth_send_cooldowns(email_key_hash,next_allowed_at)
VALUES('email-hash',1120)
ON CONFLICT(email_key_hash) DO UPDATE SET next_allowed_at=excluded.next_allowed_at
WHERE wpu_auth_send_cooldowns.next_allowed_at<=1060;
SELECT CASE WHEN (SELECT next_allowed_at FROM wpu_auth_send_cooldowns WHERE email_key_hash='email-hash')=1120
THEN 'COOLDOWN_RENEW_PASS' ELSE 'COOLDOWN_RENEW_FAIL' END AS result;

INSERT INTO wpu_auth_challenges(id,email_normalized,secret_hash,purpose,expires_at,delivered_at)
VALUES('v2-challenge','v2@example.org','v2-synthetic-digest','signin','2099-01-01T00:00:00.000Z',datetime('now'));
UPDATE wpu_auth_challenges SET attempt_count=attempt_count+1
WHERE id='v2-challenge' AND attempt_count<5 AND consumed_at IS NULL;
UPDATE wpu_auth_challenges SET consumed_at=datetime('now')
WHERE id='v2-challenge' AND consumed_at IS NULL;
UPDATE wpu_auth_challenges SET consumed_at=datetime('now')
WHERE id='v2-challenge' AND consumed_at IS NULL;
SELECT CASE WHEN
 (SELECT attempt_count FROM wpu_auth_challenges WHERE id='v2-challenge')=1
 AND (SELECT COUNT(*) FROM wpu_auth_challenges WHERE id='v2-challenge' AND consumed_at IS NOT NULL)=1
THEN 'CHALLENGE_CONSUMPTION_PASS' ELSE 'CHALLENGE_CONSUMPTION_FAIL' END AS result;
