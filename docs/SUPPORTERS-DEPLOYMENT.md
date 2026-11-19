# WPU Supporters — deployment and approval

## Current state
The supporters page submits to `POST /api/supporters/pledge`; records are stored as `pending`. The public `GET /api/supporters` endpoint returns only approved, consented records. Review uses `GET/PATCH /api/supporters/admin` with an admin bearer token. **No automatic approval is enabled.**

## Cloudflare setup
1. Provision a Cloudflare D1 database for WPU. Apply `database/supporters.sql`.
2. Configure server-only environment secrets in the Next.js runtime: `WPU_CF_ACCOUNT_ID`, `WPU_CF_D1_DATABASE_ID`, `WPU_CF_API_TOKEN`, `WPU_SUPPORTERS_ADMIN_TOKEN`. The Cloudflare token must have the minimum D1 permissions needed. Do not expose these as `NEXT_PUBLIC_*`.
3. Ensure the hosting deployment actually runs Next.js route handlers. Static-only export will not support this workflow.
4. Deploy and verify a test pledge persists; review via authenticated admin API; confirm only approved entries appear publicly.
5. Before public launch, implement Turnstile or equivalent abuse protection, rate limiting, email ownership verification, duplicate checks, audit logging and a secure admin UI. Do not put the admin bearer token in browser-side JavaScript.

## Review API
`GET /api/supporters/admin` with header `Authorization: Bearer <server admin token>` returns pending pledges.
`PATCH /api/supporters/admin` with same header and JSON `{"id":"<uuid>","decision":"approved","note":"Verified representative authority and publication consent"}` approves a pending pledge. `rejected` is also supported.
Only authorise an approval after verifying the organisation and representative. A pledge is not WPU membership, national recognition or a partnership agreement.

## Known limitations
The database is not provisioned by these repository commits. The endpoint deliberately returns 503 when not configured. The current API uses the Cloudflare D1 REST interface; deployment compatibility and operational controls must be verified. Automated approval must not be activated until identity checks and abuse protections are implemented.
