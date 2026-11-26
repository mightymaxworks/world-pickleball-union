# WPU Control affiliation pilot

## Bhutan player-initiated workflow

1. The player signs in to their existing private Passport. Under **Affiliations → Request an affiliation**, they choose Bhutan Pickleball Federation if there is a choice and select **Submit request**. Submission records their consent and sends the case directly to WPU review. No separate operator or email handoff is needed.
2. A WPU reviewer scoped to the pilot organisation verifies the player against the organisation's roster or other appropriate evidence. WPU Control shows the player's Passport display name and last eight characters of their Player ID for the case. It does not show email, contact details, residence or a searchable player directory.
3. The reviewer approves or rejects with a reason. Approval atomically creates the affiliation and its audit entry. The player can refresh **My affiliation requests** for status and reload their Passport to see the active affiliation. The Player ID is unchanged. A scoped reviewer can revoke an approval with an audit reason.

The reviewer must be a different person from the player. A second account associated with that player cannot review their case. Provision only named, verified people for real staff work. The pilot does not infer whether independently registered identities belong to the same person. No role is granted by this workflow. Affiliation stays private and does not establish federation recognition, national representation, ranking points or sporting eligibility.

Organisations not in the self-request list retain the previous scoped operator invitation flow. No new operator invitation can be created for an organisation in that list. Existing invitations and case histories are preserved.

## Validate in isolation

- `node --experimental-strip-types --test tests/*.test.mjs` validates the database state machine and rollback of a failed promotion.
- Build with `npx opennextjs-cloudflare build`, then run `bash tests/run-control-affiliations-http.sh`. The script builds a disposable D1 database and disposable locally signed application JWTs. It exercises both paths on the actual Worker, including a clearly named Bhutan test fixture. It never sends synthetic users, sessions or keys to production.

## Activate a real pilot

A code deployment does not enable the pilot. Without server configuration, `/control` and both new APIs are unavailable. The existing Passport and sign-in continue to use the unchanged membership schema and remain available.

1. Review `database/wpu-control-affiliations-v1.sql` and then `database/wpu-control-affiliations-v2.sql` against a non-production D1 binding. For a production pilot, record the target binding, current migration state and a Time Travel bookmark. After approval, apply only the missing migration files in that order, record their checksums in `wpu_schema_migrations`, and check tables, triggers and `PRAGMA foreign_key_check`. The second migration starts with an empty organisation allowlist. Do not rerun the original installation workflow or modify legacy identity rows.
   Use the **WPU production affiliation schema** GitHub workflow. It checks the six installed baseline checksums and the existing pilot schema before making changes, records a D1 bookmark and applies only missing pilot files. A repeat apply verifies and leaves the database unchanged if the two files are already installed. It changes no staff grants, organisations, Access policies or feature flags.
2. Verify the Bhutan Pickleball Federation pilot organisation internally, separate from any formal recognition. Add only its verified organisation ID to `wpu_affiliation_self_request_orgs` and give the named WPU reviewer an organisation-scoped `wpu_reviewer` grant for that ID through controlled provisioning. No separate operator grant is needed. The consenting player signs in and submits from their own Passport. Do not install test data, assign global access, or grant permissions via a browser endpoint.
3. Configure one Cloudflare Access self-hosted application covering `/control` and `/api/control/*`. Allow only named staff, require MFA, set an application session of at most one hour, and do not add bypass or service-auth policies. Keep the Passport and its affiliation request route outside Access. Verify the production hostname and any alternate Worker URL cannot act as staff without a valid application assertion.
4. Set the server bindings `WPU_CONTROL_ACCESS_ISSUER` to the trusted `https://<team>.cloudflareaccess.com` origin, `WPU_CONTROL_ACCESS_AUDIENCE` to that application's AUD, and `WPU_CONTROL_ACCESS_JWKS` to the public keys from that team's `/cdn-cgi/access/certs`. Keep current and overlap keys when Access rotates and remove retired keys. The server independently verifies the signed assertion, matches its verified email to the WPU session, and rechecks the scoped role on each operation. All four bindings must be valid, including `WPU_AFFILIATION_PILOT_ENABLED=true`, before the pilot opens.
5. Smoke test a separate verified reviewer and player, a signed-out request, and an out-of-scope account. Have the player submit from their existing Passport. Confirm the Player ID is unchanged. Then revoke a test affiliation and confirm retained history and no active affiliation.

If Access records an allowed login but WPU Control still displays **Staff verification required**, open the production Worker live logs and retry the Control page once. Filter for `wpu_control_access_rejected` with `surface: "page"`. The fixed reason distinguishes a missing assertion, a signing-key or signature problem, and a rejected claim, without including tokens, headers or personal data. Do not alter Access policy or verification checks before identifying the failure.

To pause the pilot set `WPU_AFFILIATION_PILOT_ENABLED=false` or remove it. This stops workflow actions without deleting records or hiding already granted affiliations. Remove pilot role grants through controlled revocation when the pilot ends.

To stop new self-service requests for one organisation without deleting existing work, remove that organisation from the self-request list. Keep the main pilot flag off while provisioning.
