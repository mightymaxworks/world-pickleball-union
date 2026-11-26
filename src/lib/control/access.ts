import { createPublicKey, verify, type JsonWebKey, type KeyObject } from "node:crypto";
import { queryD1 } from "@/lib/supporters-db";

type AccessEnv = {
  WPU_AFFILIATION_PILOT_ENABLED?: string;
  WPU_CONTROL_ACCESS_ISSUER?: string;
  WPU_CONTROL_ACCESS_AUDIENCE?: string;
  WPU_CONTROL_ACCESS_JWKS?: string;
};
type AccessConfig = { issuer: string; audience: string; keys: Map<string, KeyObject> };
let cached: { source: string; result: AccessConfig | null } | undefined;

export function controlConfig(): AccessConfig | null {
  const context = (globalThis as unknown as Record<symbol, {env?: AccessEnv} | undefined>)[Symbol.for("__cloudflare-context__")];
  const env = context?.env;
  if ((env?.WPU_AFFILIATION_PILOT_ENABLED ?? process.env.WPU_AFFILIATION_PILOT_ENABLED) !== "true") return null;
  const issuer = env?.WPU_CONTROL_ACCESS_ISSUER ?? process.env.WPU_CONTROL_ACCESS_ISSUER ?? "";
  const audience = env?.WPU_CONTROL_ACCESS_AUDIENCE ?? process.env.WPU_CONTROL_ACCESS_AUDIENCE ?? "";
  const jwks = env?.WPU_CONTROL_ACCESS_JWKS ?? process.env.WPU_CONTROL_ACCESS_JWKS ?? "";
  const source = JSON.stringify([issuer, audience, jwks]);
  if (cached?.source === source) return cached.result;
  let result = null;
  if (/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer) && /^[a-z0-9]{64}$/i.test(audience) && jwks.length <= 12_000) {
    try {
      const { keys: list } = JSON.parse(jwks);
      const keys = new Map<string, KeyObject>();
      if (!Array.isArray(list) || list.length < 1 || list.length > 6) throw new Error();
      for (const item of list) {
        const { kty, kid, n, e, alg, use } = item ?? {};
        if (kty !== "RSA" || typeof kid !== "string" || !kid || keys.has(kid) ||
          typeof n !== "string" || typeof e !== "string" || (alg && alg !== "RS256") || (use && use !== "sig")) throw new Error();
        const key = createPublicKey({ key: { kty, n, e } as JsonWebKey, format: "jwk" });
        if ((key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048) throw new Error();
        keys.set(kid, key);
      }
      result = { issuer, audience, keys };
    } catch { /* Invalid or missing config always leaves the pilot disabled. */ }
  }
  cached = { source, result };
  return result;
}

export function accessEmail(assertion: string | null, config: AccessConfig, surface: "page" | "api"): string | null {
  function reject(reason: string): null {
    // Fixed labels only. Never log the assertion, its claims, headers or account data.
    console.warn(JSON.stringify({ event: "wpu_control_access_rejected", surface, reason }));
    return null;
  }

  if (!assertion) return reject("missing_assertion");
  if (assertion.length > 8192 || !/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(assertion)) return reject("malformed_assertion");
  try {
    const [head, body, signature] = assertion.split(".");
    const header = JSON.parse(Buffer.from(head, "base64url").toString("utf8"));
    if (header.alg !== "RS256") return reject("unexpected_algorithm");
    const key = config.keys.get(header.kid);
    if (!key) return reject("unknown_signing_key");
    if (!verify("RSA-SHA256", Buffer.from(head + "." + body), key, Buffer.from(signature, "base64url"))) return reject("invalid_signature");
    const claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (claims.iss !== config.issuer) return reject("wrong_issuer");
    if (!Array.isArray(claims.aud) || !claims.aud.includes(config.audience)) return reject("wrong_audience");
    if (claims.type !== "app") return reject("wrong_token_type");
    if (!Number.isSafeInteger(claims.exp) || claims.exp <= now) return reject("invalid_expiry");
    if (!Number.isSafeInteger(claims.iat) || claims.iat > now + 30) return reject("invalid_issue_time");
    if (claims.exp - claims.iat > 3600) return reject("session_too_long");
    if (claims.nbf !== undefined && (!Number.isSafeInteger(claims.nbf) || claims.nbf > now)) return reject("not_yet_valid");
    if (typeof claims.email !== "string" || !/^[^\s@]+@[^\s@]+$/.test(claims.email) || claims.email.length > 254) return reject("invalid_email_claim");
    return claims.email.toLowerCase();
  } catch { return reject("unreadable_assertion"); }
}

export async function identityMatchesAccess(accountId: string, email: string): Promise<boolean> {
  const matches = await queryD1(
    "SELECT 1 FROM wpu_auth_emails WHERE account_id=? AND email_normalized=? AND verified_at IS NOT NULL",
    [accountId, email],
  );
  return matches.length === 1;
}
