# WPU-001 Session implementation — pre-release

Status: committed on draft feature branch; NOT deployed.

Session module uses cryptographically random 256-bit bearer tokens, stores only SHA-256 token digests in D1, and sets HttpOnly, Secure, SameSite=Lax, Path=/ cookies with __Host- prefix and 14-day expiry.

GET /api/auth/session reports only an authenticated boolean, not account IDs or private details.
POST /api/auth/logout enforces same-origin requests, revokes the token in D1 and clears the cookie.

**Release blockers:** Verification endpoint does not yet issue sessions or provision verified accounts. Session issuance must occur only after atomic challenge consumption and idempotent account creation. Add integration tests for invalid/revoked/expired sessions, concurrent registration, session cookies and origin checks. Confirm database migrations and Cloudflare secret configuration in staging. Add explicit CSRF protection for future account mutation routes. Never enable public registration before full end-to-end tests.
