import { readAuthJson } from "@/lib/auth/request-body";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { queryD1 } from "@/lib/supporters-db";
import { generateVerificationCode, digestVerificationCode, normalizeEmail, CODE_TTL_MS } from "@/lib/auth/challenge";
import { rateLimitKey, acquireRateLimit, acquireEmailCooldown, MAX_EMAIL_REQUESTS_PER_HOUR, MAX_IP_REQUESTS_PER_HOUR } from "@/lib/auth/rate-limit";
import { authEnvironment } from "@/lib/auth/runtime";
import { sendVerificationCode } from "@/lib/auth/resend";

export const runtime = "nodejs";
const response = () => NextResponse.json({ok:true,message:"If eligible, a verification code will be sent."},{headers:{"Cache-Control":"no-store"}});
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return NextResponse.json({error:"Origin required"},{status:403});
  try {
    const originUrl = new URL(origin);
    const host = new URL(request.url);
    if (originUrl.origin !== host.origin) return NextResponse.json({error:"Origin not allowed"},{status:403});
  } catch { return NextResponse.json({error:"Invalid origin"},{status:403}); }
  if (Number(request.headers.get("content-length")||0)>1024) return NextResponse.json({error:"Request too large"},{status:413});
  let email:string;
  try {
    const body:unknown = await readAuthJson(request);
    if (!body || typeof body!=="object" || !("email" in body) || typeof body.email!=="string") throw Error();
    email=normalizeEmail(body.email);
  } catch { return NextResponse.json({error:"Invalid email"},{status:400}); }
  const env=authEnvironment();
  if (!env.AUTH_PILOT_ENABLED) return NextResponse.json({error:"Registration pilot is not enabled"},{status:503});
  if (!env.AUTH_CODE_PEPPER || env.AUTH_CODE_PEPPER.length<32 || !env.RESEND_API_KEY) {
    return NextResponse.json({error:"Service temporarily unavailable"},{status:503});
  }
  // Only trust the edge-populated connecting-IP header; never X-Forwarded-For.
  const ip=request.headers.get("cf-connecting-ip");
  if (!ip) return NextResponse.json({error:"Service temporarily unavailable"},{status:503});
  try {
    const now=Date.now();
    const emailKey=rateLimitKey("email",email,env.AUTH_CODE_PEPPER);
    const ipKey=rateLimitKey("ip",ip,env.AUTH_CODE_PEPPER);
    const [emailAllowed,ipAllowed]=await Promise.all([
      acquireRateLimit(emailKey,MAX_EMAIL_REQUESTS_PER_HOUR,Math.floor(now/1000)),
      acquireRateLimit(ipKey,MAX_IP_REQUESTS_PER_HOUR,Math.floor(now/1000)),
    ]);
    if (!emailAllowed || !ipAllowed) return response();
    if (!await acquireEmailCooldown(emailKey, Math.floor(now/1000))) return response();
    const code=generateVerificationCode();
    const id=randomUUID();
    const hash=digestVerificationCode(email,id,code,env.AUTH_CODE_PEPPER);
    await queryD1(
      "INSERT INTO wpu_auth_challenges(id,email_normalized,secret_hash,purpose,expires_at) VALUES(?,?,?,'signin',?) RETURNING id",
      [id,email,hash,new Date(now+CODE_TTL_MS).toISOString()],
    );
    try {
      await sendVerificationCode({to:email,code,apiKey:env.RESEND_API_KEY});
      await queryD1("UPDATE wpu_auth_challenges SET delivered_at=datetime('now') WHERE id=?",[id]);
    } catch {
      await queryD1("UPDATE wpu_auth_challenges SET consumed_at=datetime('now') WHERE id=?",[id]);
      return NextResponse.json({error:"Email service temporarily unavailable"},{status:503});
    }
    return response();
  } catch {
    return NextResponse.json({error:"Service temporarily unavailable"},{status:503});
  }
}
