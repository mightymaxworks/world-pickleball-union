import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { accountForSession, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export async function GET() {
  try {
    const jar = await cookies();
    const accountId = await accountForSession(jar.get(SESSION_COOKIE)?.value);
    return NextResponse.json(
      accountId ? {authenticated:true} : {authenticated:false},
      {headers:{"Cache-Control":"no-store"}},
    );
  } catch {
    return NextResponse.json({error:"Service unavailable"},{status:503});
  }
}
