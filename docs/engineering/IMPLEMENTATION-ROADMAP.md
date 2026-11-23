# WPU engineering roadmap — baseline v1

## Milestone 0 — Baseline and policy
Audit repository and Cloudflare deployment; validate branding; retrieve original ranking simulation sources; reconcile tier/field mathematics and obtain policy approval. Exit: decision register updated, reproducible fixtures and approved numerical rules.

## Milestone 1 — Identity and security
Per-user authentication, MFA, free-member/organiser roles, player passport, scoped access; retain existing supporter flow. Exit: independent accounts and permission tests; no browser shared admin token.

## Milestone 2 — Tournament vertical slice
Event builder, division, registration, public event page, basic matches and finalisation. Exit: registered organiser runs a real test event end to end.

## Milestone 3 — All required formats
Round robin, single elimination, pool-to-knockout, double elimination including reset, team ties; seeding, byes, scheduling, scoring, corrections. Exit: deterministic fixtures for each format and edge cases.

## Milestone 4 — Rankings
Versioned calendar-year policy, five tiers, field factors, best ten, individual doubles and separate team ledger, historical snapshots. Exit: deterministic replay, correction and weak-field manipulation tests; no invented production values.

## Milestone 5 — WPU Control and integration
Admin queues, independent verification, audit, ranking corrections, Waypoint adapter and one documented independent integration path. Exit: role-scoped cases and idempotent imported results.

## Milestone 6 — Pilot and release
Real pilot tournaments, load/security/recovery tests, accessible UI, monitoring, support documentation and release gates. Exit: confirmed real results and reproducible rankings, verified deployment.

## Delivery practice
Branch → PR → tests/review → merge → deployment verification; track LOCKED/PROPOSED/IMPLEMENTED/TESTED/DEPLOYED separately. No automatic merge of policy-changing code. Prefer working vertical slices over static dashboards.