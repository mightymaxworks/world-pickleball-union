# WPU Phase 0 — Repository Baseline and Risk Register
Date: 2026-11-23
Status: PARTIAL CODE AUDIT — NOT A PRODUCTION CERTIFICATION

## Evidence reviewed
- package.json: Next.js 16.4.5, OpenNext 1.20.18, Wrangler 4.165.0.
- wrangler.jsonc: Worker entrypoint, assets, Images, R2 cache, service reference and WPU_DB D1 binding defined in source.
- database/supporters.sql and database/supporters-review-migration.sql: pledge schema, verification extension and supporter audit table.
- src/lib/supporters-db.ts: native D1 binding lookup; query and batch operations.
- src/app/api/supporters/route.ts: public approved supporter directory query.
- src/app/api/supporters/pledge/route.ts: validated submission, pending status, paired pledge/audit insert.
- src/app/api/supporters/admin/verify/route.ts: token-authenticated human verification; does not publish.
- .github/workflows/wpu-d1-local-integration.yml: isolated D1 fixture and audit guard tests defined.
- src/components/CompetitionRankingBoard.tsx: animated placeholder rows, not a ranking calculator.
- docs/WPU-CLOUDFLARE-BINDING-INVENTORY.md and docs/WPU-RELEASE-CHECKS.md: prior production missing-binding/HTTP 503 incident.
- README.md: still generic Next.js scaffold instructions.

## Findings and classifications
| Finding | Status | Implication |
|---|---|---|
| Cloudflare/OpenNext configuration exists in GitHub | IMPLEMENTED | Must verify deployed effective configuration separately |
| WPU_DB configured in wrangler.jsonc | IMPLEMENTED | Prior production evidence showed missing runtime binding; live resolution unverified |
| Supporter pledge API and D1 SQL | IMPLEMENTED | Do not assume deployed healthy until live smoke test |
| Supporter verification and audit logic | IMPLEMENTED | Security and end-to-end verification still needed |
| Local D1 integration GitHub workflow | IMPLEMENTED | Workflow presence is not proof of passing latest run |
| Ranking board component | IMPLEMENTED (placeholder UI) | Does not compute rankings |
| Tournament engine | NOT VERIFIED | Full repository inventory required |
| Ranking engine | NOT VERIFIED | No official point publication allowed |
| Identity and player membership | NOT VERIFIED | Design before tournament entries |
| Production backup and restore | NOT VERIFIED | Required before any schema changes |

## Specific risks to resolve
1. **Deployment drift:** The current checked-in Wrangler config contains WPU_DB while docs report a prior production runtime without it. Inspect deployed Worker bindings and execute an authenticated operational check before declaring fixed.
2. **Existing D1 scope:** Current database is named wpu-supporters. Decide whether new competition domains use a separate D1 database or additive tables, based on isolation, migrations, operational and recovery needs. Do not rename or modify production without a migration/rollback plan.
3. **Legacy docs:** WPU-NATIVE-CLOUDFLARE.md says no verified complete Wrangler config exists; this is inconsistent with the current checked-in wrangler.jsonc. Update only after comparing the actual deployed configuration.
4. **Security:** Existing admin verification uses a bearer secret. New WPU Control must use individual identity, scoped permissions, session management and attributable audit actors, not a shared bearer token in client-side JavaScript.
5. **API robustness:** Public supporter GET exposes diagnostic binding checks on 503. Review whether production responses should omit internal diagnostics while retaining server-side logging.
6. **Validation:** Existing pledge request checks content-length header but should also have bounded body parsing at the platform level; verify abuse controls and rate limiting.
7. **State transition correctness:** Verify conditional supporter verification update and associated audit behavior under concurrent requests with integration tests.
8. **Policy:** Exact ranking tables, field factors, tier rules, ties and exceptional results remain PROPOSED.

## Required Phase 0 actions
- Inventory repository tree, all branches and open PRs; map routes, database schema and tests.
- Inspect Cloudflare deployed bindings and re-test GET /api/supporters (200 expected), pending pledge insertion and audit persistence in a controlled environment.
- Confirm current CI run results, production deployment commit and rollback approach.
- Draft identity/tournament/ranking domain boundaries, API contracts, permission matrix and state machines.
- Define additive migration scripts and isolated local D1 tests before touching production.
- Publish ranking policy unresolved-decision register and reproducible simulation cases.
- Update README and outdated deployment docs only with verified evidence.

## Release safeguards
No destructive production database operations, no live secret exposure, no official rankings publication and no claim of deployment without runtime verification. Documentation-only changes in this PR do not modify production behavior.
