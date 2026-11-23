# WPU engineering architecture — proposed baseline v1

## Existing stack
Next.js 16.4.5, React 19.2.8, OpenNext Cloudflare 1.20.18, Wrangler 4.165.0, Cloudflare Workers and D1 WPU_DB (wpu-supporters). See existing docs/WPU-* operational guides and wrangler.jsonc. Existing code must be reviewed before modifications.

## Target
Modular monolith initially with domain boundaries: identity, membership, tournament, ranking, integrity, governance, notifications, integration. Public portal, organiser workspace and WPU Control share domain APIs but separate authorization boundaries. WPU owns authoritative identifiers, results and rankings; Waypoint is nonexclusive integration.

## Data flow
Member → organiser event → division/entries → draw version → matches/scores → signed final result package → integrity checks → versioned ranking awards → best-ten season snapshot → public leaderboard. Corrections generate new result version and compensating award adjustments.

## Infrastructure
D1 transactional relational state; R2 for permitted evidence/media; durable background jobs for ranking recalculations, imports and notifications; signed webhooks and scoped API credentials. Specific Queue/R2 bindings for new modules must be configured only when implemented. Test D1 scaling, concurrent scoring, read patterns and recovery before global rollout.

## Security
Per-user authentication with MFA, server-side authorization, scoped permissions, CSRF protection, rate limiting, input validation, privacy controls, audit history, secret management, backups, incident response. Current shared-token admin API is interim only. No client exposure of secrets.

## Engineering controls
Schema migrations, indexes and foreign keys; idempotent write APIs; deterministic calculation versions; automated unit/integration/format tests; staging before production; rollback and observability. Avoid destructive schema changes to supporter tables.

## Branding
Reuse docs/brand/BRAND-STANDARD-v1.md and ASSET-REGISTER-v1.md; no invented logos or unapproved shields.