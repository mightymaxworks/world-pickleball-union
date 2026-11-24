/** Cloudflare secrets must only be read server-side. */
type AuthEnvironment = { RESEND_API_KEY?: string; AUTH_CODE_PEPPER?: string; AUTH_PILOT_ENABLED?: string };
export function authEnvironment(): Omit<AuthEnvironment, 'AUTH_PILOT_ENABLED'> & {AUTH_PILOT_ENABLED:boolean} {
  const context = (globalThis as unknown as Record<symbol, {env?: AuthEnvironment} | undefined>)[Symbol.for("__cloudflare-context__")];
  return {
    AUTH_PILOT_ENABLED: (context?.env?.AUTH_PILOT_ENABLED || process.env.AUTH_PILOT_ENABLED) === 'true',
    RESEND_API_KEY: context?.env?.RESEND_API_KEY || process.env.RESEND_API_KEY,
    AUTH_CODE_PEPPER: context?.env?.AUTH_CODE_PEPPER || process.env.AUTH_CODE_PEPPER,
  };
}
