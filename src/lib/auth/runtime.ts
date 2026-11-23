/** Cloudflare secrets must only be read server-side. */
type AuthEnvironment = { RESEND_API_KEY?: string; AUTH_CODE_PEPPER?: string };
export function authEnvironment(): AuthEnvironment {
  const context = (globalThis as unknown as Record<symbol, {env?: AuthEnvironment} | undefined>)[Symbol.for("__cloudflare-context__")];
  return {
    RESEND_API_KEY: context?.env?.RESEND_API_KEY || process.env.RESEND_API_KEY,
    AUTH_CODE_PEPPER: context?.env?.AUTH_CODE_PEPPER || process.env.AUTH_CODE_PEPPER,
  };
}
