# WPU native Cloudflare deployment contract

WPU runs on Cloudflare Workers and uses Cloudflare D1 as its only database. No TinyFish, third-party browser automation or D1 REST API token is required.

## Native binding
The existing production D1 database `wpu-supporters` must be exposed to the application as `WPU_DB`. The code in `src/lib/supporters-db.ts` expects a native D1 binding and intentionally fails closed when missing.

## Deployment configuration: preserve before editing
The current Cloudflare Worker is deployed using Git integration (`npm run build`, `npx wrangler deploy`). The repository does not currently contain a verified complete Wrangler configuration. **Do not add a partial `wrangler.jsonc`**, as doing so may remove the existing Images, R2 cache, ASSETS and service bindings or break OpenNext deployment.

Before consolidating deployment configuration, export or inspect the effective Wrangler configuration from the working Cloudflare deployment, and retain its generated Worker entrypoint, assets, compatibility flags and every existing binding. Add `WPU_DB` to that complete configuration.

## Release verification
1. GitHub build checks pass.
2. `GET /api/supporters` returns HTTP 200 and `{ "supporters": [] }` (or approved records), without `error`.
3. A test pledge inserts a pending row.
4. Unverified pledges never appear in public results.
5. Audit events and human exception decisions persist.
6. Automatic approval remains disabled until independent verification and abuse checks are live.

## Failure diagnosis
`diagnostic: "binding_missing"` means the runtime did not expose the native binding. `diagnostic: "query_failed"` means a query or another database operation failed. The server logs contain further detail. Neither outcome should trigger an automatic approval.
