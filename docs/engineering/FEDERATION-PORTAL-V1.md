# Federation Passport and roster pilot v1

This is Milestone 1A. WPU still operates registration, Player Passport, and affiliation review. A federation manages its own approved roster separately. It cannot modify a WPU Player ID, player profile, affiliation approval, domestic recognition, or competition eligibility. Waypoint and OurOwn are attribution only.

## Player and federation journeys

- A WPU-approved federation can link to `/federations/<slug>`. Existing Passport holders sign in and return to the federation entry. New holders use the same verified WPU registration. The federation does not collect passwords or issue a new Player ID.
- An enabled federation that participates in the existing self-request pilot can accept requests. WPU reviews them through the existing workflow. The player sees the outcome on the federation entry and their Passport.
- A federation administrator signs in to `/control` through Cloudflare Access and the matching verified WPU account. Only the administrator's scoped, enabled federations appear. They can view WPU-approved affiliations, put a player on a **local** hold, return a player to the roster, or download the filtered roster in CSV and the current page in v1 JSON. Both downloads contain only display names, WPU Player IDs and local roster status. CSV is for spreadsheets and may prefix formula-like values with visible text. JSON preserves the original values and is the integration format. An append-only roster event records who made each change. Approval revocation removes the player from the live roster; it does not recall a downloaded export.

## Reference contracts

All private responses are non-cacheable. IDs are opaque and permanent. Do not read the D1 tables from other systems or scrape the UI.

| Route | Caller and request | Successful result |
| --- | --- | --- |
| `GET /api/control/federation-roster` | Staff Access assertion plus matching WPU session and active organisation-admin role | `{version:1,federations:[{slug,name}]}` |
| `GET /api/control/federation-roster?federation=<slug>&after=<cursor>` | Same, for assigned federation. Omit cursor on the first page. | `{version:1,federation,players:[{playerId,displayName,rosterStatus}],next}`, up to 50. Use `next` until it is null. |
| `POST /api/control/federation-roster` | Legacy roster mutation, only available before the Federation Members migration. | After migration, returns 409 and directs the caller to the audited member workflow. |
| `POST /api/federations/v1/identity/grant` | WPU-origin approved consent interface, verified WPU player session, JSON `{clientId,consent:true}` | 201 `{code,expiresIn:120}`, usable once by that client and only for its federation. Issuing again replaces the earlier code for that client and affiliation. |
| `POST /api/federations/v1/identity/exchange` | Registered client backend with its bearer key and JSON `{clientId,code}` | `{version:1,playerId,displayName,organisationId}`. No email, DOB, contact data, login cookie, or long-lived player token. |

400 means invalid input, 401 missing sign-in or client credential, 403 denied, 404 pilot unavailable, 409 conflict/no state change, 503 temporary service failure. Consent and grant routes do not support cross-origin JavaScript or redirects. Only the WPU-owned reference client in disposable tests uses the handoff today. Before onboarding an external client, implement and review a WPU-hosted consent screen that names the client and displays the shared fields, and a supported delivery flow. Never put codes or keys in URLs, expose client keys to a browser, or treat this contract as OAuth or an external sign-in service.

## Release and rollback

1. Verify the GitHub and Cloudflare production Worker deployment and the bound WPU D1 database. The WPU production federation preparation workflow checks the prior migration checksums, applies the additive schema, and stages the existing Bhutan federation under slug `bhutan` disabled. It does not write roles, clients, or Worker settings.
2. Confirm the named federation administrator already has a verified WPU account and set the appropriate organisation-scoped role and Cloudflare Access policy. This is separate from the WPU review role. Do not grant administrator access to a player or infer it from an email already allowed into WPU Control.
3. Enable the Bhutan portal and set Worker variable `WPU_FEDERATION_PILOT_ENABLED=true` only when ready to test. Leave identity clients disabled in production. The existing affiliation flag and review policy do not change. Run the Bhutan entry → existing Passport → affiliation review → scoped roster/export journey with authorised users. Verify staff without that federation role cannot see the roster.
4. For rollback, set the federation pilot flag to false. Keep the existing Passport and WPU affiliation feature flag unchanged. To selectively stop the portal or a future client, disable its registry row. Disabling or revoking an approved affiliation blocks outstanding grants at redemption. A prior export or exchange remains a past disclosure.

Run `bash tests/run-control-affiliations-http.sh` after an OpenNext build. It exercises the existing WPU affiliation pilot and the new portal with two disposable federations, scoped roles, stable IDs, and the reference client's consent/exchange, replay, and revoked-access checks.


## Live Bhutan pilot acceptance

1. Open [Bhutan federation entry](https://worldpickleball.world/federations/bhutan) after activation. Sign in as an existing player and verify the same ID on [Player Passport](https://worldpickleball.world/passport), with no second registration. For a fresh affiliation check use a consenting existing Passport holder not already affiliated. A separate test with a consenting new player confirms registration returns to Bhutan and issues exactly one ID.
2. Have WPU review the new request in [WPU Control](https://worldpickleball.world/control). Verify the approved affiliation appears on the federation entry and Passport. An already approved member can be used to test the roster without submitting another request.
3. Sign in as the named Bhutan roster administrator via Cloudflare Access. Confirm only Bhutan appears, then place the consenting player's roster entry on hold and return it to Listed. Verify the Player ID and approved affiliation did not change.
4. Export filtered CSV and current-page JSON. Confirm both contain just the Bhutan roster names, Player IDs and local roster status, with no email or birth date. Staff without the Bhutan roster role must not see the panel. External identity exchange remains disabled in production.

## Federation Members

In WPU Control, a staff-verified WPU account with the verified matching email and an active federation administrator grant gets a searchable list of its federation’s current WPU-approved affiliations. It can search by display name, permanent Player ID or local member number, filter by club, category and roster status, and open a member record without losing its filters.

The member’s WPU ID and approval are read-only. Administrators can add a local member number, primary club, category, join date and renewal date. These belong to the federation, are optional and separate from the WPU Passport and affiliations. There are no contact details or payment fields. Changing the local roster status requires a reason. The record shows the most recent 30 roster events with actor, time and reason when available. A hold never changes WPU identity, affiliation or competition eligibility.

Filtered CSV contains all matches up to 1,000. JSON remains limited to the current page. Both contain only the original three fields (player name, WPU Player ID and roster status). The existing roster GET endpoint is unchanged. After the member schema is applied, updates through the legacy roster endpoint are replaced by audited actions in the member record.

The federation preparation workflow applies and verifies the additive member schema on the existing WPU D1 binding. The prior roster remains available until this schema is registered. The migration does not enroll people, alter roles or enable any other portal or client.

### Bhutan acceptance

1. As a Bhutan federation administrator, open **WPU Control → Federation Members**. Search for an existing approved member, open the record, and return. Confirm the search and filters are preserved.
2. With an authorized pilot record, save local details and search by the local number. Use the filtered CSV and current-page JSON. Confirm no local numbers, dates or contact details are exported.
3. If the federation approves a hold test, put that pilot record on hold with a reason. Confirm it appears when filtering for **On hold**, the history records the action, and the Passport still shows the approved affiliation. Restore the roster entry and confirm the second history event. No affiliation reapplication is needed.
4. Check a WPU reviewer without a federation-admin grant can still review cases and cannot read or export the federation’s member list. A roster-only Bhutan admin should not see a reviewer role warning.

The next functional milestone is federation-scoped tournament setup. Federation-defined dues and renewal status can later build on the local member record, without linking a payment status to an automatic roster hold.

## Rollout of federation affiliations

- Players find the feature in Join WPU or in Passport → Affiliations. The searchable /federations directory lists verified national federations whose Passport page is enabled and whose online requests are switched on. It publishes only names, countries and links. Existing country links continue to work, including Bhutan.
- Use the same registration, review and Passport flow for every federation. Keeping one Player ID across multiple approvals and keeping reviewers scoped to their federation are release tests. Test disabled directory entries, invitation-only entries, rejection and withdrawal alongside the successful path.
- Before publishing another federation, verify its existing organisation record, nominate its operator and WPU reviewer, and run one real request from sign-in through approval and Passport display. Keep admissions, nationality, competition eligibility and third-party identity integrations separate.
- The player-facing feature is available wherever a federation is enabled for online requests. Broader rollout means onboarding more federations to that same feature. Publish and pause federation affiliation in WPU Control instead of one-off database setup. See the [activation runbook](FEDERATION-ACTIVATION.md) for operator, reviewer and live acceptance steps.
