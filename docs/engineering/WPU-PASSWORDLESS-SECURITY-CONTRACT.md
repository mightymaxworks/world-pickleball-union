# WPU-001 Passwordless Challenge Security Contract
Status: CODE UTILITIES ONLY — no live authentication endpoints.

- Six-digit codes are generated using Node cryptographic randomInt.
- HMAC-SHA256 digest binds email, challenge ID and code, keyed by a separate server secret AUTH_CODE_PEPPER (minimum 32 characters); never store raw codes.
- Code validity is 10 minutes; maximum 5 attempts per challenge; 60-second resend cooldown.
- Challenge ID and attempts must be persisted server-side and updated atomically. Current D1 schema lacks attempts and throttling counters: add migrations before enabling endpoints.
- Account creation must occur only after email ownership verification, with idempotent transaction and private-by-default profile.
- Rate-limit by IP and email with server-enforced persistence or Cloudflare protections; never rely on UI timers.
- Return anti-enumeration responses and do not leak email registration status.
- Session tokens require independent random secret generation, hashing at rest, HttpOnly Secure SameSite cookies, CSRF checks, expiration, rotation and revocation.
- Authentication code verification must use timing-safe comparison, but rate limiting remains essential because codes have only 1,000,000 possibilities.
- Resend delivery adapter must be invoked only from the server and never return secrets to the browser.
- No public registration or email-sending endpoint should be deployed until all controls and test cases are implemented.
