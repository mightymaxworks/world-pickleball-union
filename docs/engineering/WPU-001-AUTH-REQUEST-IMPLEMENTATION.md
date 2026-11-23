# WPU-001 authentication request endpoint
Status: IMPLEMENTED IN FEATURE BRANCH; not deployed or end-to-end tested.

Endpoint: POST /api/auth/request-code, JSON {email}.
- Same-origin request enforcement; edge connecting-IP requirement.
- Email normalization and generic response for throttled requests.
- Persistent hourly email/IP limits via atomic D1 UPSERT.
- 60-second cooldown and single-use HMAC-digested six-digit challenge with ten-minute expiry.
- Resend delivery and challenge invalidation on delivery failure.
- Requires RESEND_API_KEY and a distinct random AUTH_CODE_PEPPER (minimum 32 characters) configured as Worker secrets.
- Requires the v1 identity and passwordless migrations followed by database/wpu-passwordless-auth-v2.sql.
- No verification endpoint, session issuance, profile creation or public signup UI yet. Do not advertise as live.
- Before enabling publicly: test parallel request race/cooldown behavior, provider failure behavior, CSRF handling, abuse monitoring and controlled mail delivery.
- In particular, the cooldown check and insert are not atomic: concurrent requests may send multiple codes; fix before public launch.
