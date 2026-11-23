# WPU controlled Cloudflare cutover

## Verified
- Branch `chore/cloudflare-opennext-migration`, PR #4
- GitHub CI run 45120902782: success
- OpenNext + Wrangler dry-run run 45120896591: success
- Pinned Next.js 16.4.5, @opennextjs/cloudflare 1.20.18, Wrangler 4.165.0
- `open-next.config.ts`, `wrangler.jsonc` checked in
- Production D1 connection has **not** passed a live test

## Production commands — must change together
Cloudflare Workers Builds project root: `/`
- Build command: `npm run build && npx opennextjs-cloudflare build`
- Deploy command: `npx wrangler deploy`

The build command intentionally generates `.open-next/worker.js` and `.open-next/assets` before Wrangler reads the committed config. Do not leave the old build-only command active when merging this branch.

## Before merging
1. Confirm Cloudflare build settings can be updated in coordination with merge, or stage a separate non-production Worker for the cutover.
2. Preserve Worker name and routes, Images `IMAGES`, R2 `NEXT_INC_CACHE_R2_BUCKET`, service `WORKER_SELF_REFERENCE`, assets `ASSETS`, and D1 `WPU_DB`.
3. Confirm the generated Worker runtime accepts the existing binding names. Review deployment dry-run output and compare against Cloudflare dashboard.
4. Have a rollback plan using the previous active Worker version.

## Post-deployment release gates
1. Confirm deployment version and binding `WPU_DB` appear in Cloudflare dashboard.
2. Run GitHub manual `wpu-production-smoke.yml`; expect HTTP 200.
3. Submit one controlled pending pledge, verify D1 insertion and audit record.
4. Verify pledge is not published while unverified.
5. Do not enable auto-approval until independent verification, abuse controls and admin workflow pass security review.

## Warning
Merging the branch while Cloudflare still runs `npm run build` alone can break deployment because `.open-next/worker.js` will not be generated. Do not merge automatically.
