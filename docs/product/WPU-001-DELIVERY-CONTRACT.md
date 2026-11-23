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
