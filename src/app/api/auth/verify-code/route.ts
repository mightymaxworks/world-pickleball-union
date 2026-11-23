import { NextResponse } from "next/server";
import { queryD1 } from "@/lib/supporters-db";
import { normalizeEmail, verifyVerificationCode, MAX_CODE_ATTEMPTS } from "@/lib/auth/challenge";
import { authEnvironment } from "@/lib/auth/runtime";
import { acquireRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
const invalid = () => NextResponse.json({ok:false,error:"Invalid or expired verification code"},{status:400,headers:{"Cache-Control":"no-store"}});

/**
 * Verifies and consumes a challenge, but does NOT create a session.
 * This endpoint must remain behind the WPU-001 rollout gate until session issuance
 * and member provisioning are implemented and tested together.
 */
export async function POST(request:Request) {
  const origin=request.headers.get("origin");
  if (!origin) return NextResponse.json({error:"Origin required"},{status:403});
  try {
    if (new URL(origin).origin !== new URL(request.url).origin)
      return NextResponse.json({error:"Origin not allowed"},{status:403});
  } catch {return NextResponse.json({error:"Invalid origin"},{status:403});}
  if (Number(request.headers.get("content-length")||0)>1024)
    return NextResponse.json({error:"Request too large"},{status:413});
  let email:string, code:string;
  try {
    const body:unknown=await request.json();
    if (!body || typeof body!=="object" || !("email" in body) || !("code" in body) ||
        typeof body.email!=="string" || typeof body.code!=="string" || !/^\d{6}$/.test(body.code))
      return invalid();
    email=normalizeEmail(body.email); code=body.code;
  } catch {return invalid();}
  const env=authEnvironment();
  if (!env.AUTH_CODE_PEPPER || env.AUTH_CODE_PEPPER.length<32)
    return NextResponse.json({error:"Service unavailable"},{status:503});
  const ip=request.headers.get("cf-connecting-ip");
  if (!ip) return NextResponse.json({error:"Service unavailable"},{status:503});
  try {
    const now=Math.floor(Date.now()/1000);
    const allowed=await Promise.all([
      acquireRateLimit(rateLimitKey("ip-verify",ip,env.AUTH_CODE_PEPPER),60,now),
      acquireRateLimit(rateLimitKey("email-verify",email,env.AUTH_CODE_PEPPER),20,now),
    ]);
    if (allowed.some(x=>!x)) return invalid();
    const rows=await queryD1(
      `SELECT id,secret_hash,attempt_count FROM wpu_auth_challenges
       WHERE email_normalized=? AND purpose='signin' AND consumed_at IS NULL
         AND delivered_at IS NOT NULL AND expires_at>?
         AND attempt_count<? ORDER BY created_at DESC,id DESC LIMIT 1`,
      [email,new Date().toISOString(),MAX_CODE_ATTEMPTS],
    );
    if (!rows.length) return invalid();
    const row=rows[0];
    const id=String(row.id);
    // Atomic attempt reservation: simultaneous requests cannot bypass attempt limits.
    const reserved=await queryD1(
      `UPDATE wpu_auth_challenges SET attempt_count=attempt_count+1
       WHERE id=? AND consumed_at IS NULL AND delivered_at IS NOT NULL
         AND expires_at>? AND attempt_count<?
       RETURNING id`,
      [id,new Date().toISOString(),MAX_CODE_ATTEMPTS],
    );
    if (!reserved.length) return invalid();
    if (!verifyVerificationCode(email,id,code,env.AUTH_CODE_PEPPER,String(row.secret_hash))) return invalid();
    const consumed=await queryD1(
      `UPDATE wpu_auth_challenges SET consumed_at=datetime('now')
       WHERE id=? AND consumed_at IS NULL AND expires_at>? AND delivered_at IS NOT NULL
       RETURNING id`,
      [id,new Date().toISOString()],
    );
    if (!consumed.length) return invalid();
    // No session or authentication cookie is issued here.
    return NextResponse.json({ok:true,verified:true,sessionCreated:false},{headers:{"Cache-Control":"no-store"}});
  } catch {
    return NextResponse.json({error:"Service unavailable"},{status:503});
  }
}
