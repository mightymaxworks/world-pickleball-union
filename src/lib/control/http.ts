import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { accountForSession, SESSION_COOKIE } from "@/lib/auth/session";

export const privateHeaders = { "Cache-Control": "private, no-store" };
export const controlError = (status: number, error: string) => NextResponse.json({ error }, { status, headers: privateHeaders });
export const controlJson = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: privateHeaders });
export const isSameOrigin = (request: Request) => request.headers.get("origin") === new URL(request.url).origin;
export const caseIdPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;

export async function signedInAccount() {
  const jar = await cookies();
  return accountForSession(jar.get(SESSION_COOKIE)?.value);
}

export async function controlBody(request: Request): Promise<Record<string, unknown> | null> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  try {
    let bytes = 0, data = "";
    const decoder = new TextDecoder("utf-8", { fatal: true });
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 4096) { await reader.cancel(); return null; }
      data += decoder.decode(part.value, { stream: true });
    }
    const result = JSON.parse(data + decoder.decode());
    return result && typeof result === "object" && !Array.isArray(result) ? result : null;
  } catch { return null; }
  finally { reader.releaseLock(); }
}
