import { createHash, randomBytes } from "node:crypto";
import { queryD1 } from "@/lib/supporters-db";

export const SESSION_COOKIE = "__Host-wpu_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("Invalid session token");
  return createHash("sha256").update(token).digest("hex");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true as const,
    secure: true as const,
    sameSite: "lax" as const,
    path: "/" as const,
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function issueSession(accountId: string): Promise<string> {
  const token = createSessionToken();
  const hash = hashSessionToken(token);
  const expires = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  const { randomUUID } = await import("node:crypto");
  const rows = await queryD1(
    "INSERT INTO wpu_auth_sessions(id,account_id,session_hash,expires_at) VALUES(?,?,?,?) RETURNING id",
    [randomUUID(), accountId, hash, expires],
  );
  if (rows.length !== 1) throw new Error("Session creation failed");
  return token;
}

export async function accountForSession(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  let hash: string;
  try { hash = hashSessionToken(token); } catch { return null; }
  const rows = await queryD1(
    `SELECT s.account_id FROM wpu_auth_sessions s
     JOIN wpu_accounts a ON a.id=s.account_id
     WHERE s.session_hash=? AND s.revoked_at IS NULL AND s.expires_at>?
       AND a.status='active' LIMIT 1`,
    [hash, new Date().toISOString()],
  );
  return rows.length ? String(rows[0].account_id) : null;
}

export async function revokeSession(token: string | undefined): Promise<void> {
  if (!token) return;
  let hash: string;
  try { hash = hashSessionToken(token); } catch { return; }
  await queryD1(
    "UPDATE wpu_auth_sessions SET revoked_at=datetime('now') WHERE session_hash=? AND revoked_at IS NULL RETURNING id",
    [hash],
  );
}
