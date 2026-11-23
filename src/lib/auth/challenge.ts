import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/** Pure passwordless challenge helpers. Do not import in client components. */
export const CODE_TTL_MS = 10 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_CODE_ATTEMPTS = 5;

export function generateVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email address");
  }
  return email;
}

/** Use a server-only, randomly generated AUTH_CODE_PEPPER, never the Resend API key. */
export function digestVerificationCode(
  email: string,
  challengeId: string,
  code: string,
  pepper: string,
): string {
  if (!pepper || pepper.length < 32) throw new Error("Auth pepper not configured");
  if (!/^\d{6}$/.test(code)) throw new Error("Invalid verification code");
  if (!challengeId) throw new Error("Missing challenge ID");
  return createHmac("sha256", pepper)
    .update(JSON.stringify([normalizeEmail(email), challengeId, code]))
    .digest("hex");
}

export function verifyVerificationCode(
  email: string,
  challengeId: string,
  code: string,
  pepper: string,
  expectedDigest: string,
): boolean {
  if (!/^[0-9a-f]{64}$/.test(expectedDigest)) return false;
  try {
    const actual = Buffer.from(digestVerificationCode(email, challengeId, code, pepper), "hex");
    const expected = Buffer.from(expectedDigest, "hex");
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function canAttemptCode(input: {
  now: number;
  expiresAt: number;
  consumed: boolean;
  attempts: number;
}): boolean {
  return !input.consumed &&
    input.now < input.expiresAt &&
    input.attempts < MAX_CODE_ATTEMPTS;
}
