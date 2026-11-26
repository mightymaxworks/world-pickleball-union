# Federation Passport and roster pilot v1

This is Milestone 1A. WPU still operates registration, Player Passport, and affiliation review. A federation manages its own approved roster separately. It cannot modify a WPU Player ID, player profile, affiliation approval, domestic recognition, or competition eligibility. Waypoint and OurOwn are attribution only.

## Player and federation journeys

- A WPU-approved federation can link to `/federations/<slug>`. Existing Passport holders sign in and return to the federation entry. New holders use the same verified WPU registration. The federation does not collect passwords or issue a new Player ID.
- An enabled federation that participates in the existing self-request pilot can accept requests. WPU reviews them through the existing workflow. The player sees the outcome on the federation entry and their Passport.
- A federation administrator signs in to `/control` through Cloudflare Access and the matching verified WPU account. Only the administrator's scoped, enabled federations appear. They can view WPU-approved affiliations, put a player on a **local** hold, return a player to the roster, or export the current page as v1 JSON. An append-only roster event records who made each change. Approval revocation removes the player from the live roster; it does not recall a downloaded export.

## Reference contracts

All private responses are non-cacheable. IDs are opaque and permanent. Do not read the D1 tables from other systems or scrape the UI.

| Route | Caller and request | Successful result |
| --- | --- | --- |
| `GET /api/control/federation-roster` | Staff Access assertion plus matching WPU session and active organisation-admin role | `{version:1,federations:[{slug,name}]}` |
| `GET /api/control/federation-roster?federation=<slug>&after=<cursor>` | Same, for assigned federation. Omit cursor on the first page. | `{version:1,federation,players:[{playerId,displayName,rosterStatus}],next}`, up to 50. Use `next` until it is null. |
| `POST /api/control/federation-roster` | Same, same-origin JSON `{federation,playerId,rosterStatus}`, status is `listed` or `on_hold` | `{version:1,ok:true}`. A redundant update returns 409 and writes nothing. |
| `POST /api/federations/v1/identity/grant` | WPU-origin approved consent interface, verified WPU player session, JSON `{clientId,consent:true}` | 201 `{code,expiresIn:120}`, usable once by that client and only for its federation. Issuing again replaces the earlier code for that client and affiliation. |
| `POST /api/federations/v1/identity/exchange` | Registered client backend with its bearer key and JSON `{clientId,code}` | `{version:1,playerId,displayName,organisationId}`. No email, DOB, contact data, login cookie, or long-lived player token. |

400 means invalid input, 401 missing sign-in or client credential, 403 denied, 404 pilot unavailable, 409 conflict/no state change, 503 temporary service failure. Consent and grant routes do not support cross-origin JavaScript or redirects. Only the WPU-owned reference client in disposable tests uses the handoff today. Before onboarding an external client, implement and review a WPU-hosted consent screen that names the client and displays the shared fields, and a supported delivery flow. Never put codes or keys in URLs, expose client keys to a browser, or treat this contract as OAuth or an external sign-in service.

## Release and rollback

1. Verify the GitHub and Cloudflare production Worker deployment and the bound WPU D1 database. Run the additive `database/wpu-federation-portal-v1.sql` only after the existing affiliation v2 schema. It contains no role grants or production fixtures.
2. Register the existing verified Bhutan federation under slug `bhutan` initially disabled. Confirm the named federation administrator already has a verified WPU account and set the appropriate organisation-scoped role and Cloudflare Access policy. This is separate from the WPU review role. Do not grant administrator access to a player or infer it from an email already allowed into WPU Control.
3. Enable the Bhutan portal and set Worker variable `WPU_FEDERATION_PILOT_ENABLED=true` only when ready to test. Leave identity clients disabled in production. The existing affiliation flag and review policy do not change. Run the Bhutan entry → existing Passport → affiliation review → scoped roster/export journey with authorised users. Verify staff without that federation role cannot see the roster.
4. For rollback, set the federation pilot flag to false. Keep the existing Passport and WPU affiliation feature flag unchanged. To selectively stop the portal or a future client, disable its registry row. Disabling or revoking an approved affiliation blocks outstanding grants at redemption. A prior export or exchange remains a past disclosure.

Run `bash tests/run-control-affiliations-http.sh` after an OpenNext build. It exercises the existing WPU affiliation pilot and the new portal with two disposable federations, scoped roles, stable IDs, and the reference client's consent/exchange, replay, and revoked-access checks.
