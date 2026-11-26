# WPU engineering roadmap — baseline v1

## Milestone 0 — Baseline and policy
Audit repository and Cloudflare deployment; validate branding; retrieve original ranking simulation sources; reconcile tier/field mathematics and obtain policy approval. Exit: decision register updated, reproducible fixtures and approved numerical rules.

## Milestone 1 — Identity and security
Per-user authentication, MFA, free-member/organiser roles, player passport, scoped access; retain existing supporter flow. Exit: independent accounts and permission tests; no browser shared admin token.

## Milestone 1A — Portable Passport and federation self-service
Extend the existing Passport instead of replacing identity or registration. Build a federation-branded entry and a scoped roster with search, local membership details, auditable hold and restore, and filtered export. A WPU-owned test client must demonstrate that a separate system can use the documented identity handoff without direct database access or a federation administrator's session. Exit: stable Player IDs, independently tested federation boundaries, scoped export and revocation, and a successful Bhutan self-service pilot. Live Bhutan acceptance precedes Tournament Creation (WPU-002). Keep staff onboarding and federation dues on separate tracks. A payment state must not automatically change an affiliation or local roster status.

## Milestone 1B — Public onboarding
Make Join WPU, Player Passport sign-in and organisation participation discoverable from the public site. Connect organisation intake to a staff-owned decision process without implying formal admission or granting operational permissions. Keep pledges and hosting enquiries separate.

## Milestone 2 — Shared tournament vertical slice
One event builder for authorised federations, associations, clubs and organisers. Scope permissions to their organisations and events. Start with one Bhutan event and one doubles division, then exercise registration, public event page, basic matches and finalisation. Exit: registered organiser runs a real test event end to end.

## Milestone 3 — All required formats
Round robin, single elimination, pool-to-knockout, double elimination including reset, team ties; seeding, byes, scheduling, scoring, corrections. Exit: deterministic fixtures for each format and edge cases.

## Milestone 4 — Rankings
Versioned calendar-year policy, five tiers, field factors, best ten, individual doubles and separate team ledger, historical snapshots. Exit: deterministic replay, correction and weak-field manipulation tests; no invented production values.

## Milestone 5 — WPU Control and integration
Admin queues, independent verification, audit, ranking corrections and a documented provider-neutral integration path. Exit: role-scoped cases and idempotent imported results through a reference client. Named providers may add adapters later and are not a milestone dependency.

## Milestone 6 — Pilot and release
Real pilot tournaments, load/security/recovery tests, accessible UI, monitoring, support documentation and release gates. Exit: confirmed real results and reproducible rankings, verified deployment.

## Delivery practice
Branch → PR → tests/review → merge → deployment verification; track LOCKED/PROPOSED/IMPLEMENTED/TESTED/DEPLOYED separately. No automatic merge of policy-changing code. Prefer working vertical slices over static dashboards.

### Module acceptance

- Keep business rules separate from page components, storage and provider adapters. Start in the existing application and split deployments only if there is a concrete reason.
- Keep IDs and organisation scopes stable. Where an external use case exists, document a versioned, permission-scoped input/output contract, with safe exports and explicit error responses. External clients must not rely on internal tables or UI scraping.
- For external writes, verify retries do not duplicate records. Define corrections, provenance and audit records where writes affect competition or ranking data.
- Use a reference client and fixtures for integration tests. WPU workflows must operate without credentials, endpoints or infrastructure from a partner system. Existing WPU production services are unchanged. Waypoint and OurOwn credits are branding only and create no operational dependency.
