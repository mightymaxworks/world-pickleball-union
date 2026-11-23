# WPU Identity Foundation v1 — Engineering Notes
Status: IMPLEMENTED IN FEATURE BRANCH, TEST RESULTS PENDING. Not deployed.

## Purpose
Create canonical person, account, player profile, organisation, membership, scoped role assignment and identity audit records. This is the first additive schema foundation for WPU competitions and rankings.

## Scope and boundaries
- A person may have one or more linked accounts; authentication integration and verified account linking are NOT implemented.
- Public player codes are unique; assignment/generation is NOT implemented.
- Organisation and membership eligibility rules, birth-date validation, privacy/consent, age verification, duplicate resolution, account recovery and retention remain to be designed.
- Role rows are data only; server-side authorisation enforcement, role assignment policy and separation of duties are NOT implemented.
- Audit table is a foundation; tamper resistance and complete operational audit coverage are NOT implemented.
- No supporter records are migrated or automatically treated as player accounts.
- No tournament or ranking API is activated.

## Database strategy
For initial testing, run migration on an isolated local D1 database with existing supporter tables to check coexistence. Whether to place production competition domains in separate D1 database(s) remains an architecture decision. The migration is additive and does not modify supporter tables. Do not run against production until database separation, backups, rollback and Cloudflare runtime binding verification are complete.

## Test
GitHub Actions workflow `.github/workflows/wpu-identity-schema.yml` applies legacy supporter schema and identity migration to local D1, then checks fixture and preservation of legacy supporter table. CI status must be inspected; existence of workflow is not proof of a passing run.

## Next engineering slice
Implement server-side authentication and individual account ownership, authorization checks, scoped permissions, privacy constraints, validated identity API contracts and integration tests before exposing identity operations to the public.
