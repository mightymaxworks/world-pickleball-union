# WPU Resend delivery adapter
Status: IMPLEMENTED IN FEATURE BRANCH; not deployed or verified against live Resend.

## Configuration
Resend sending domain: mail.worldpickleball.world (user reports verified).
Sender: WPU <verify@mail.worldpickleball.world>.
Cloudflare Worker secret: RESEND_API_KEY (user reports configured). Do not commit secret values or expose them to the client.

## Adapter
src/lib/auth/resend.ts sends a six-digit verification code through Resend's HTTPS API from server-side code. It checks recipient and code formats, applies an 8-second timeout, and avoids logging provider responses. No public endpoint calls it yet.

## Important release dependencies
- Integrate with the approved identity/passwordless D1 schema from PR #12 after merge.
- Use cryptographically secure random code generation; store a keyed digest only, not plaintext.
- Enforce expiry (10 minutes), 5 attempts per code, 60-second resend cooldown, per-IP and per-email rate limits, anti-enumeration responses and replay protection.
- Atomic consume and session issuance, secure HttpOnly/SameSite cookies, CSRF protection, logout and recovery.
- Verify mail sender authorization and delivery in a controlled staging/test account before public registration.
- Protect against mail sending abuse and unexpected costs.
- No client code may receive RESEND_API_KEY or call Resend directly.
- Production deployment and end-to-end WPU-001 acceptance are not complete.

## Verification
Build validation and integration tests must pass. Do not infer live email delivery from a successful build.
