-- Local-only regression fixture: the audit must follow exactly one eligible transition.
INSERT INTO supporter_pledges
 (id,name,country,region,category,website,representative,email,status,authority_confirmed,publication_consent,created_at,verification_status)
VALUES
 ('review-eligible','Verified Local Club','Singapore','Asia','Clubs & Communities','https://example.org','Test','test@example.org','pending',1,1,datetime('now'),'verified'),
 ('review-unverified','Unverified Local Club','Singapore','Asia','Clubs & Communities','https://example.org','Test','test@example.org','pending',1,1,datetime('now'),'unverified');
-- Approved verified pledge: exactly one audit entry.
UPDATE supporter_pledges SET status='approved' WHERE id='review-eligible' AND status='pending' AND verification_status='verified';
INSERT INTO supporter_audit (id,pledge_id,action,actor,reason,policy_version)
 SELECT 'audit-eligible','review-eligible','approved','local-test','test','wpu-supporters-v1' WHERE changes()=1;
-- Repeated approval: must not generate a second audit.
UPDATE supporter_pledges SET status='approved' WHERE id='review-eligible' AND status='pending' AND verification_status='verified';
INSERT INTO supporter_audit (id,pledge_id,action,actor,reason,policy_version)
 SELECT 'audit-repeat','review-eligible','approved','local-test','test','wpu-supporters-v1' WHERE changes()=1;
-- Unverified pledge cannot be approved.
UPDATE supporter_pledges SET status='approved' WHERE id='review-unverified' AND status='pending' AND verification_status='verified';
INSERT INTO supporter_audit (id,pledge_id,action,actor,reason,policy_version)
 SELECT 'audit-unverified','review-unverified','approved','local-test','test','wpu-supporters-v1' WHERE changes()=1;
SELECT CASE WHEN
 (SELECT COUNT(*) FROM supporter_audit WHERE pledge_id='review-eligible')=1
 AND (SELECT COUNT(*) FROM supporter_audit WHERE pledge_id='review-unverified')=0
 AND (SELECT status FROM supporter_pledges WHERE id='review-eligible')='approved'
 AND (SELECT status FROM supporter_pledges WHERE id='review-unverified')='pending'
 THEN 'PASS' ELSE 'FAIL' END AS result;
