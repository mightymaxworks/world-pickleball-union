-- WPU identity invariants v1: additive indexes for first release.
-- Must be applied AFTER wpu-identity-foundation-v1.sql.
-- Prevent duplicate concurrently active individual membership records.
CREATE UNIQUE INDEX IF NOT EXISTS ux_wpu_one_active_individual_membership
ON wpu_memberships(person_id)
WHERE membership_type='individual' AND status='active';

-- Prevent duplicated active role grants in the same scope.
CREATE UNIQUE INDEX IF NOT EXISTS ux_wpu_active_role_global
ON wpu_role_assignments(account_id,role)
WHERE scope_type='global' AND revoked_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_wpu_active_role_scoped
ON wpu_role_assignments(account_id,role,scope_type,scope_id)
WHERE scope_type!='global' AND revoked_at IS NULL;

-- Avoid duplicate organisation membership rows for the same person/org in active state.
CREATE UNIQUE INDEX IF NOT EXISTS ux_wpu_active_organisation_membership
ON wpu_memberships(person_id,organisation_id)
WHERE membership_type='organisation' AND status='active';
