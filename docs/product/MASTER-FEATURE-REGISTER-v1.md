# WPU Master Feature Register v1
Status: TRACKING BASELINE — 2026-11-23

## Authority and rules
- Approved requirements come from docs/project/MASTER-HANDOVER.md, docs/project/DECISION-REGISTER.md, docs/product/RANKING-POLICY.md and project handover.
- Every item has a stable ID, business rules, UX, API/data, tests, deployment evidence, and owner/reviewer.
- Status is tracked independently across SPECIFIED, DESIGNED, IMPLEMENTED, TESTED, DEPLOYED, ACCEPTED, BLOCKED; a preview is not implementation.
- A feature is ACCEPTED only after a real user completes the workflow in the target environment and all acceptance checks pass.
- Approved features cannot be removed or deferred silently; changes require a decision-register entry.
- Deliver one usable vertical slice at a time, with cross-cutting security/audit foundations added as necessary.
- Free WPU tournament/ranking services for members do not imply free organiser entry fees.
- Official ranking publication remains blocked until exact mathematics and integrity policy are approved.

## Delivery order and traceability
| ID | Feature | Core acceptance criterion | Initial evidence / status | Dependencies |
|---|---|---|---|---|
| WPU-001 | Membership and Player Passport | Person registers, verifies account, signs in, receives unique player code, views/updates permitted profile, returns to persistent data | Identity schema on PR #12 tested in isolated D1; UX sample PR #13 deployed as preview; end-to-end NOT IMPLEMENTED | Auth, permissions, data privacy |
| WPU-002 | Tournament creation | Scoped organiser creates, edits and publishes an event with divisions and eligibility rules | NOT IMPLEMENTED | WPU-001 |
| WPU-003 | Tournament registration | Eligible player registers, receives confirmation, handles full/waitlist/withdrawal and doubles partner conditions | NOT IMPLEMENTED | WPU-001, WPU-002 |
| WPU-004 | Tournament operations | Draw, court schedule, score, confirm, finalise, correct with audit | NOT IMPLEMENTED | WPU-002, WPU-003 |
| WPU-005 | Competition formats | Round robin, single elimination, pool-to-knockout, double elimination/reset and team ties all complete test fixtures | NOT IMPLEMENTED | WPU-004 |
| WPU-006 | Provisional ranking calculations | Versioned result ingestion, calendar year, best 10, five tiers, field factors, individual doubles, team ledger, deterministic replay | NOT IMPLEMENTED; numerical policy pending | WPU-004, approved simulation parameters |
| WPU-007 | Official rankings publication | Approved policy, integrity review, publication snapshots, corrections, dispute traceability | BLOCKED pending approved policy | WPU-006, governance |
| WPU-008 | WPU Control core | Staff accounts, scoped permissions, decision queue, audit, separation of duties | NOT IMPLEMENTED | WPU-001 security foundation |
| WPU-009 | Equipment certification | Brand submission, test workflow, certification ledger, NFC validity and public check | NOT IMPLEMENTED | WPU-008, standards policy |
| WPU-010 | Governance, integrity and appeals | Case evidence, human decision, appeal and audit lifecycle | NOT IMPLEMENTED | WPU-008 |
| WPU-011 | Education and development | Global initiatives, coach/official pathways and programme management | Public content exists; operational workflows NOT IMPLEMENTED | Identity/organisation |
| WPU-012 | External integrations | Secure, idempotent Waypoint and independent provider result exchange | NOT IMPLEMENTED | WPU-004, WPU-006 |
| WPU-013 | Finance and partnerships | Partner records, permissions, financial controls and reporting | NOT IMPLEMENTED | WPU-008 |
| WPU-014 | AI Operations | Explainable recommendations, task automation, human escalation, audit | NOT IMPLEMENTED | WPU-008, governance |
| WPU-015 | Public site and supporter continuity | Existing pages and supporter submissions continue operating after each release | Existing code; re-verify live on every release | Cloudflare/D1 |

## Required evidence per feature
- Product: source requirement and decision ID, edge cases, acceptance scenarios.
- UX: screen routes, accessible responsive designs, all empty/loading/error/success states.
- Backend: API contracts, server-side authorization, schema migrations, transaction safety.
- QA: unit/integration/e2e test runs, regression checks and security evidence.
- Release: PR and commit, deployed version, live smoke, rollback route, owner sign-off.

## Immediate active feature
WPU-001 is the sole active end-to-end product slice. WPU-002 design can be explored but must not displace WPU-001 implementation. Cross-cutting work is allowed only when needed for WPU-001 completion or production safety.

## Policy conflicts to reconcile, not silently resolve
The ranking research's rolling 52 weeks/best 8 is superseded by calendar-year/best 10. Exact points mathematics remains pending. WPU Control's long-term scope remains wider than its initial security foundation. The current Player Journey preview is sample data, not a real membership service.
