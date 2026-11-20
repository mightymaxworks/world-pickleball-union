# WPU release checks — GitHub-first, no browser automation

Cloudflare's existing Git integration owns production deployment. The GitHub build workflow checks pull requests and main. The production smoke test is **manual only** to avoid unnecessary usage; run it from GitHub Actions when needed.

## Current known issue
The public `/api/supporters` endpoint previously returned HTTP 503. Passing `npm run build` does not prove D1 runtime connectivity. The smoke workflow will fail until the live endpoint returns a healthy JSON response.

## Cloudflare bindings
The production Worker has `WPU_DB` (D1), `NEXT_INC_CACHE_R2_BUCKET` (R2), `WORKER_SELF_REFERENCE` and `IMAGES`. Do not add an incomplete Wrangler config that would overwrite the existing deployment's bindings or OpenNext settings. First obtain the effective deployed Wrangler configuration and migrate it intact into version control.

## Release gate
Do not activate automated publication until: D1 runtime connectivity, verified ownership, spam controls, durable audit records, admin authentication and end-to-end tests all pass. Keep unverified pledges pending.

## Costs
No TinyFish required. GitHub Actions and Cloudflare remain subject to their normal plan limits.
