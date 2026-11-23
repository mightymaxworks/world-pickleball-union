# WPU-001 — Membership and Player Passport End-to-End Contract
Status: SPECIFIED FOR IMPLEMENTATION; not deployed or accepted.

## User story
As a new player, I can register for free core WPU services, verify my account, sign in, obtain a permanent WPU Player ID, view my Passport, edit permitted profile details, and return later to see my saved information.

## Required journey
1. Public membership entry point clearly explains benefits, eligibility, privacy and terms.
2. Register with minimum necessary details, accessible validation and anti-abuse protection.
3. Verify account ownership using a server-validated, expiring single-use mechanism.
4. Sign in with secure session; do not expose tokens in browser storage or client source.
5. Create canonical person and player profile idempotently; allocate collision-resistant public player code.
6. Show Passport with verified membership state, profile, future events and rankings as empty states.
7. Edit permitted fields with authorization and durable audit; protect sensitive attributes.
8. Sign out, return, sign in, and confirm persisted profile and correct access control.
9. Provide recovery, duplicate-account review and administrative exception handling.

## Technical scope
- Decide auth provider or first-party auth implementation based on Cloudflare/OpenNext constraints, security, maintenance and cost; document ADR before coding.
- Server-side sessions, CSRF/origin protections, throttling, safe errors and email verification.
- D1 migration must be additive, isolated and backed up before any production change.
- One-to-one unique public player code and idempotent registration.
- Permission checks on every profile and admin API; no shared admin token in client.
- Data minimization, consent/version tracking, privacy controls, deletion/retention procedure.
- Never treat supporter pledge records as verified member identities.
- Do not invent a payment requirement; free core membership experience pending legal/fee policy clarification.

## Acceptance tests
A. Fresh user registers, verifies, signs in and receives unique code.
B. Refresh and subsequent sign-in preserve profile.
C. A second user cannot read or modify private fields of the first.
D. Duplicate verification and concurrent registration do not create duplicate profiles.
E. Expired verification, invalid credentials, rate limit and unavailable database produce safe responses.
F. Mobile keyboard, screen reader, validation, loading, empty and success states are usable.
G. Sign out invalidates session; recovery flow works.
H. Existing supporter routes and public pages pass regression tests.
I. Production smoke after deploy confirms account creation and persistence using controlled test accounts; no real data exposed.
J. Owner reviews actual UI/UX and accepts the completed workflow.

## Not in scope
Tournament registration and ranking points are subsequent slices. Passport placeholders must explicitly state no verified events or official points.

## Definition of done
All acceptance tests passed with links to run evidence; PR merged; deployed version verified; rollback documented; feature marked ACCEPTED. Partial completion remains IMPLEMENTED or TESTED only.

## Locked registration decisions (2026-11-23)
- Authentication: passwordless email verification code or magic link. The engineering implementation must choose a secure verified flow, with single-use expiry and replay prevention. Password is not required.
- Date of birth: deferred at account creation; required before the player's first tournament entry. Store privately and enforce age eligibility server-side.
- Phone number: optional, collected later when relevant; not required for membership.
- Public player profile: PRIVATE by default, with explicit opt-in to public visibility. Changing visibility must be authenticated and audited.
- Account registration must not imply publication of a player's profile, date of birth, email or phone.
- Account and player records may exist before DOB is provided; entry eligibility must fail closed until DOB and other division-specific requirements are satisfied.
- For minors, implement age-appropriate privacy and guardian safeguards before enabling youth registration in applicable jurisdictions.
- Distinguish residence country from national representation eligibility; representation is not automatically inferred from residence.

## Minimum signup fields and progressive data
At signup: email, full name or player name (legal identity verification requirements to be established), residence country, privacy/terms acknowledgement, and passwordless verification. No DOB or phone required at signup.
After signup: immutable WPU player code, editable profile fields with access controls, optional phone, optional public visibility.
At first event entry: DOB, applicable division eligibility and any required consent/guardian or representation evidence.

## Required additional acceptance tests
K. User can register without DOB or phone, and profile visibility defaults to private.
L. Player cannot enter first tournament without supplying DOB and satisfying age eligibility.
M. Public profile cannot be viewed before explicit opt-in; private email, phone and DOB are never exposed in public API responses.
N. Expired/reused passwordless links or codes are rejected; login requests are rate limited and do not reveal whether an email is registered.
O. Player can opt in and opt out of public profile; both transitions are authorised and audited.
