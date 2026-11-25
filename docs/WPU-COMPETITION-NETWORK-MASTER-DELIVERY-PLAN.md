# WPU Competition Network — Master Delivery Plan
Status: PROPOSED delivery plan; approved strategic direction. Updated: 2026-11-23.

## Locked principles
- WPU owns its canonical sporting records, ranking authority and tournament technology.
- Free core tournament administration and ranking eligibility for registered members; organiser entry fees are separate.
- Waypoint and other systems integrate through documented interfaces, without mandatory vendor dependency.
- Calendar-year ranking seasons; best 10 results per discipline; T1–T5; small-field reductions; individual doubles points follow players; team ledger separate.
- All eligible tournaments can generate points subject to objective integrity criteria, with no mandatory paid sanctioning gate.
- Five required formats: round robin, single elimination, pool-to-knockout, double elimination with losers brackets and applicable resets, configurable team competitions.
- Human authority retained for consequential governance, appeals, ethics and constitutional decisions.
- Build tournament and ranking systems together, but do not publish official ranking points before policy validation and release approval.

## Verified repository baseline (limited audit)
- Existing Next.js/OpenNext/Cloudflare configuration: package.json and wrangler.jsonc.
- D1 binding WPU_DB currently points to database named wpu-supporters; preserve production data and do not run destructive migrations.
- Supporter API and admin routes, supporter database scripts and deployment documentation exist.
- src/components/CompetitionRankingBoard.tsx is a visual placeholder, explicitly marked FRAMEWORK IN DEVELOPMENT and AWAITING OFFICIAL COMPETITION DATA.
- docs/WPU-RELEASE-CHECKS.md records an earlier HTTP 503 for /api/supporters. Treat this as an unresolved historical warning until the live endpoint is re-tested.
- No production-ready tournament or ranking engine verified in this limited audit. Full code, workflow, database and live-environment audit is required.
- Root README.md remains a Next.js starter README; replace with accurate project guidance after full audit.

## Delivery phases and acceptance gates
### Phase 0: Verified baseline and engineering foundation (indicative 1–2 weeks)
Audit code, branches, CI, Cloudflare bindings, D1 schema, secrets boundaries, existing production routes and current documentation. Deliver implementation inventory, architecture decisions, migration plan, API contracts, permission model and reproducible test plan. Gate: baseline signed off, existing supporter workflows protected.

### Phase 1: Identity and membership (indicative 2–3 weeks)
Canonical person/player IDs, accounts, membership states, organisations, scoped organiser/admin permissions, duplicate detection, audit events and privacy model. Gate: two distinct test users can register and access permitted functions; unauthorized access rejected.

### Phase 2: Tournament vertical slice (indicative 2–4 weeks)
Event creation, divisions, entries, seeding/draws, match lifecycle, scores, confirmation, result finalisation and public results. Gate: real end-to-end test event completed with durable, traceable records.

### Phase 3: Ranking policy and provisional engine (indicative 2–3 weeks)
Consolidate previous ranking research; propose and approve exact points tables, tier criteria, field factors, ties, exceptions and manipulation controls. Implement policy-versioned deterministic calculations, best-10 aggregation, correction ledger, team ledger and simulations. Gate: replayable test results, edge cases, integrity tests and policy approval. Official publication remains disabled.

### Phase 4: All competition formats (indicative 2–4 weeks)
Round robin, single elimination, pool-to-knockout, double elimination including resets, and configurable team matches. Add withdrawals, forfeits, interruptions, scheduling and court allocations. Gate: each format passes end-to-end fixtures and operational user acceptance.

### Phase 5: WPU Control and interoperability (indicative 2–4 weeks)
Task-oriented admin Command Centre; membership, tournaments, rankings, integrity, certification, education, governance, finance and AI Operations domain foundations. API/webhook ingestion with provenance, authentication, deduplication and replay protection. Gate: permission, audit, approval and external import workflows pass. Wider organisational modules can be released incrementally; do not claim all are complete at competition launch.

### Phase 6: Staging, release and production verification (indicative 1–2 weeks)
Security/privacy/accessibility/mobile/load tests; backups, recovery, monitoring, incident and rollback drills; staging acceptance; Cloudflare release; post-deployment smoke tests and real user pilot. Gate: all release criteria evidenced and ranking publication separately approved.

## Dependencies and critical path
- Identity precedes authoritative entries and rankings.
- Verified finalised results precede ranking awards.
- Ranking policy approval precedes official ranking publication.
- Core tournament state machine precedes additional bracket formats.
- Secure admin authorization and audit precede consequential approvals.
- Infrastructure/runtime validation precedes production changes.
- The indicative overall target is 12–18 weeks with overlapping workstreams; this is a planning assumption, not a commitment.

## Workstreams
1. Product/design: player portal, organiser workspace, WPU Control, official branding and accessible mobile operations.
2. Data/backend: identities, tournaments, results, ranking awards, governance, integrations.
3. Ranking policy: research reconciliation, policy parameters, simulations, anti-manipulation.
4. Infrastructure/security: D1 migrations, CI, Cloudflare bindings, secrets, observability, backups.
5. QA/operations: fixtures, UAT, rollback, production evidence.

## Release controls
Every item is labelled LOCKED, PROPOSED, IMPLEMENTED, TESTED, DEPLOYED or BLOCKED. Do not treat these statuses as interchangeable.
- PRs on feature branches; review, tests and migration checks before merge.
- No destructive production migrations or unapproved paid services.
- Production deployment verified separately from code merge.
- Official ranking publication is a separate feature flag and approval gate.
- Preserve historical results, correction provenance and ranking-policy versions.
- Document incident response, recovery and operational ownership.

## Immediate next PRs
1. Baseline audit and architecture decision register, including supporter endpoint runtime health.
2. Additive identity schema/migration and permission model with tests.
3. Tournament domain schema and first event/match state machine with tests.
4. Provisional ranking calculation contract and simulation harness (no official points).
5. First working end-to-end competition vertical slice.

## Open decisions requiring evidence or policy approval
Exact ranking point mathematics, tier qualifications, field-size factors, ties, exceptional results, ranking integrity thresholds, organiser fees versus free platform scope, minimum verification standards, legal/privacy obligations by jurisdiction, support/incident ownership and production launch date.

## Reporting
At each milestone publish: verified code/commit and PR links, tests run and results, deployment environment, known risks, next deliverables, blockers, and any approval needed from project owner.
