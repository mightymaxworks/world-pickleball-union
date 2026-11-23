import { createHmac } from "node:crypto";
import { queryD1 } from "@/lib/supporters-db";

const WINDOW_SECONDS = 3600;
export const MAX_EMAIL_REQUESTS_PER_HOUR = 5;
export const MAX_IP_REQUESTS_PER_HOUR = 30;

export function rateLimitKey(type: "email" | "ip", value: string, pepper: string): string {
  if (pepper.length < 32) throw new Error("Auth pepper not configured");
  return createHmac("sha256", pepper).update(JSON.stringify([type, value])).digest("hex");
}

/** Atomic UPSERT prevents concurrent requests bypassing the limit. */
export async function acquireRateLimit(key: string, max: number, nowSeconds: number): Promise<boolean> {
  const windowStart = Math.floor(nowSeconds / WINDOW_SECONDS) * WINDOW_SECONDS;
  const result = await queryD1(
    `INSERT INTO wpu_auth_rate_limits (key_hash, window_start, attempt_count)
     VALUES (?, ?, 1)
     ON CONFLICT(key_hash,window_start) DO UPDATE SET attempt_count=attempt_count+1
     WHERE attempt_count < ?
     RETURNING attempt_count`,
    [key, windowStart, max],
  );
  return result.length === 1;
}

/** Single-statement rolling cooldown, safe under concurrent D1 requests. */
export async function acquireEmailCooldown(emailKey: string, nowSeconds: number): Promise<boolean> {
  const result = await queryD1(
    `INSERT INTO wpu_auth_send_cooldowns(email_key_hash,next_allowed_at)
     VALUES (?,?)
     ON CONFLICT(email_key_hash) DO UPDATE SET next_allowed_at=excluded.next_allowed_at
     WHERE wpu_auth_send_cooldowns.next_allowed_at <= ?
     RETURNING next_allowed_at`,
    [emailKey, nowSeconds + 60, nowSeconds],
  );
  return result.length === 1;
}
