# Proposed Cloudflare migration (not production configuration)

This branch tests the official OpenNext Cloudflare adapter **without deploying**.

The production Worker remains connected to `main`. Do not merge until the adapter build and Wrangler dry-run pass and the Cloudflare Git build/deploy commands are changed together.

Known bindings to preserve:
- Images: `IMAGES`
- R2: `NEXT_INC_CACHE_R2_BUCKET` -> `world-pickleball-union-opennext-cache`
- Service: `WORKER_SELF_REFERENCE` -> `world-pickleball-union`
- D1: `WPU_DB` -> `wpu-supporters` (ID `f245a594-0932-41b9-b255-aeaa1300b639`)
- Generated asset binding `ASSETS` and any other runtime binding must remain intact.

Compatibility date `2026-11-18`; flags `nodejs_compat` and `global_fetch_strictly_public`.

The inspection run on main found no checked-in Wrangler config and no `.open-next` output from `next build`. It also found Wrangler's auto-configuration path recommending `@opennextjs/cloudflare`.

Next: generate and validate the adapter's output on this branch; then commit exact pinned dependencies, lockfile and a complete Wrangler config. The production build command must generate the adapter output and the deploy command must use the adapter's supported deployment path. Do not use a bare `npx wrangler deploy` against a plain `next build` output.

Security: no production credentials, no automatic approvals and no test writes against production D1 during this migration.
