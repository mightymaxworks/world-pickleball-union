# WPU Control affiliation pilot

## Workflow

1. A staff operator with `organisation_admin` scoped to a verified organisation submits the player's voluntarily shared full WPU Player ID and an evidence summary. Staff should not enter sensitive personal information, contact details or attachments in a reason. There is no player directory or profile lookup.
2. The private Passport lists the invitation. The player can accept or decline. Acceptance permits independent review, not publication or automatic approval. No email is sent by this slice.
3. A `wpu_reviewer` explicitly scoped to that organisation decides the request and records the reason. The proposer or player cannot act as reviewer for that case, even via a second account. Global roles do not grant access to this workflow.
4. One database write records the approval, append-only history and existing-format organisation membership atomically. The same Passport and Player ID show the affiliation on refresh. A scoped reviewer may revoke it with a reason, which records the revocation without deleting the history. The workspace lists up to 50 cases with open cases first, and shows only the last eight characters of a player's ID.

No new roles are granted by using this flow. There are no automatic hierarchy permissions. An affiliation does not establish federation recognition, national representation, ranking points or sporting eligibility.

## Validate in isolation

- `node --experimental-strip-types --test tests/*.test.mjs` validates the database state machine and rollback of a failed promotion.
- Build with `npx opennextjs-cloudflare build`, then run `bash tests/run-control-affiliations-http.sh`. The script makes a disposable D1 database and disposable locally signed application JWTs. It exercises the actual Worker and never sends synthetic users, sessions or keys to production.

## Activate a real pilot

A code deployment does not enable the pilot. Without server configuration, `/control` and both new APIs are unavailable. The existing Passport and sign-in continue to use the unchanged membership schema and remain available.

1. Review the additive `database/wpu-control-affiliations-v1.sql` migration against a non-production D1 binding. For a production pilot, record the target binding, current migration state and a Time Travel bookmark. After approval, apply only this one new migration, record its checksum in `wpu_schema_migrations`, and check tables, triggers and `PRAGMA foreign_key_check`. Do not rerun the original installation workflow or modify legacy identity rows.
2. Confirm one genuine verified organisation, an active and verified operator account, a separate active and verified reviewer account, and a consenting player. Grant only `organisation_admin` and `wpu_reviewer` with `scope_type='organisation'` and that organisation's ID, using WPU's controlled provisioning. Do not seed the Bhutan federation, imply recognition, or assign global access. This release intentionally has no browser role-grant endpoint.
3. Configure one Cloudflare Access self-hosted application covering `/control` and `/api/control/*`. Allow only named staff, require MFA, set an application session of at most one hour, and do not add bypass or service-auth policies. Keep the Passport and its player invitation route outside Access. Verify the production hostname and any alternate Worker URL cannot act as staff without a valid application assertion.
4. Set the server bindings `WPU_CONTROL_ACCESS_ISSUER` to the trusted `https://<team>.cloudflareaccess.com` origin, `WPU_CONTROL_ACCESS_AUDIENCE` to that application's AUD, and `WPU_CONTROL_ACCESS_JWKS` to the public keys from that team's `/cdn-cgi/access/certs`. Keep current and overlap keys when Access rotates and remove retired keys. The server independently verifies the signed assertion, matches its verified email to the WPU session, and rechecks the scoped role on each operation. All four bindings must be valid, including `WPU_AFFILIATION_PILOT_ENABLED=true`, before the pilot opens.
5. Smoke test separate staff identities, a signed-out and out-of-scope account, and the consenting player's existing Passport. Confirm the Player ID is unchanged. Then revoke a test affiliation and confirm retained history and no active affiliation.

To pause the pilot set `WPU_AFFILIATION_PILOT_ENABLED=false` or remove it. This stops workflow actions without deleting records or hiding already granted affiliations. Remove pilot role grants through controlled revocation when the pilot ends.
