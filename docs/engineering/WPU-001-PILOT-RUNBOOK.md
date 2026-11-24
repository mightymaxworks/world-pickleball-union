# WPU-001 controlled pilot runbook
Status: release candidate preparation; not deployment authorization.
Evidence: initial authenticated Worker journey passed at d5e2d627 (run 45369161598). Returning-player extension at 297bc595 awaiting CI.
## Preconditions
- All CI checks green on release SHA; review migration and rollback, policy text, adult-only pilot eligibility, account recovery escalation and access controls.
- Use separate staging Worker and separate D1 database, never production supporter D1. Restrict staging with Cloudflare Access to named adult testers. Verify Access enforcement on all hostnames, including workers.dev and preview aliases.
- Set RESEND_API_KEY and independent random AUTH_CODE_PEPPER as staging secrets only; never commit values. AUTH_PILOT_ENABLED defaults false. Enable only after access and migration verification. Disable immediately on failure.
## Migration order
Apply identity-foundation-v1, identity-invariants-v1, passwordless-auth-v1, passwordless-auth-v2, passwordless-auth-v3, organisation-foundation-v2 (all database/wpu-*.sql). Review target database ID before executing. Track each applied migration; non-idempotent ALTER statements must not be rerun blindly. Back up any existing database before migration. No production migration in this pilot.
## Acceptance
1. Open staging /join on desktop and mobile; verify branding, country selection, accessible labels and approved policy links.
2. Register with approved tester email; receive actual Resend code; verify and reach /passport.
3. Record permanent player code; check private visibility and global membership; edit name and reload.
4. Sign out; confirm Passport access denied; sign in with fresh code; verify same player code and edited name.
5. Check wrong, expired and reused codes, resend limits and cross-account access rejection. Verify affiliation display using synthetic memberships only; no real BPF recognition claim.
6. Verify existing public website remains unaffected. Record exact deployment SHA, staging URL, test outcomes and owner acceptance.
## Recovery
No automatic identity merge or email reassignment. Lost email access requires human review and independently verified evidence; no account changes until approved recovery procedure exists. Do not solicit secrets or identity documents via public support channels.
## Rollback
Disable pilot; revoke affected sessions if necessary; roll back Worker version. Preserve audit and identity data; do not drop tables as routine rollback. Investigate before reactivation.

## Approved deployment approach — 2026-11-24
Owner elects existing production Worker for initial deployment instead of separate staging infrastructure. This supersedes the separate staging requirement for this release only. Deploy code with AUTH_PILOT_ENABLED=false; do not enable registration until reviewed additive migrations, backup, live smoke checks, approved policies, adult tester restrictions and actual server-side tester access controls are verified. Existing supporter data must be preserved. A feature flag alone is not a tester allowlist. Record deployment SHA and migration evidence. Production database changes require a verified target and backup. Future staging remains recommended.
