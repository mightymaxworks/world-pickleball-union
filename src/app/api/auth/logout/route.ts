import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revokeSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return NextResponse.json({error:"Origin required"},{status:403});
  try {
    if (new URL(origin).origin !== new URL(request.url).origin)
      return NextResponse.json({error:"Origin not allowed"},{status:403});
  } catch {return NextResponse.json({error:"Invalid origin"},{status:403});}
  const jar = await cookies();
  try { await revokeSession(jar.get(SESSION_COOKIE)?.value); }
  catch { return NextResponse.json({error:"Service unavailable"},{status:503}); }
  const response = NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
  response.cookies.set(SESSION_COOKIE,"",{...sessionCookieOptions(),maxAge:0});
  return response;
}
