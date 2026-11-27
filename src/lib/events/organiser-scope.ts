export const organiserPredicate = (organisation: string) => `EXISTS (
 SELECT 1 FROM wpu_role_assignments r
 JOIN wpu_accounts a ON a.id=r.account_id AND a.status='active'
 JOIN wpu_organisations scope_org ON scope_org.id=r.scope_id AND scope_org.status='verified'
 WHERE a.id=? AND r.scope_type='organisation' AND r.scope_id=${organisation}
 AND r.role='organiser' AND r.revoked_at IS NULL
 AND EXISTS (SELECT 1 FROM wpu_auth_emails e WHERE e.account_id=a.id AND e.verified_at IS NOT NULL))`;
