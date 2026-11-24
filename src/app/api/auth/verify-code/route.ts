import { readAuthJson } from "@/lib/auth/request-body";
import { randomUUID } from "node:crypto";
import { createSessionToken, hashSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS, sessionCookieOptions } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { queryD1 } from "@/lib/supporters-db";
import { normalizeEmail, verifyVerificationCode, MAX_CODE_ATTEMPTS } from "@/lib/auth/challenge";
import { authEnvironment } from "@/lib/auth/runtime";
import { acquireRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
const invalid = () => NextResponse.json({ok:false,error:"Invalid or expired verification code"},{status:400,headers:{"Cache-Control":"no-store"}});

/** Verify email and atomically provision a global account and session. Draft only. */
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
  let name="", givenName="", familyName="", locality="", country="", consent=false;
  try {
    const body:unknown=await readAuthJson(request);
    if (!body || typeof body!=="object" || !("email" in body) || !("code" in body) ||
        typeof body.email!=="string" || typeof body.code!=="string" || !/^\d{6}$/.test(body.code))
      return invalid();
    email=normalizeEmail(body.email); code=body.code;
    if ("givenName" in body && typeof body.givenName==="string") givenName=body.givenName.trim();
    if ("familyName" in body && typeof body.familyName==="string") familyName=body.familyName.trim();
    if ("locality" in body && typeof body.locality==="string") locality=body.locality.trim();
    name=[givenName,familyName].filter(Boolean).join(" ");
    if ("country" in body && typeof body.country==="string") country=body.country.trim().toUpperCase();
    consent="consent" in body && body.consent===true;
  } catch {return invalid();}
  const env=authEnvironment();
  if (!env.AUTH_PILOT_ENABLED) return NextResponse.json({error:"Registration pilot is not enabled"},{status:503});
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
       WHERE email_normalized=? AND purpose='signin' AND delivered_at IS NOT NULL
       ORDER BY created_at DESC,id DESC LIMIT 1`,
      [email],
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
    const existing=await queryD1("SELECT account_id FROM wpu_auth_emails WHERE email_normalized=? AND verified_at IS NOT NULL",[email]);
    if (!existing.length && (!givenName || givenName.length>80 || familyName.length>79 || !locality || locality.length>120 || name.length>160 || !/^[A-Z]{2}$/.test(country) || !consent))
      return NextResponse.json({error:"Registration details and consent required"},{status:400});
    const token=createSessionToken();
    await queryD1(
      `INSERT INTO wpu_verified_signup_grants(challenge_id,email_normalized,person_id,account_id,player_code,display_name,country_code,consent_version,session_id,session_hash,session_expires_at,given_name,family_name,residence_locality)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING challenge_id`,
      [id,email,randomUUID(),randomUUID(),"WPU-"+randomUUID().replaceAll("-","").toUpperCase(),name||"Returning member",country||"ZZ",existing.length?"returning-login":"wpu-registration-v1",randomUUID(),hashSessionToken(token),new Date(Date.now()+SESSION_TTL_SECONDS*1000).toISOString(),givenName||null,familyName||null,locality||null],
    );
    const result=NextResponse.json({ok:true,verified:true,sessionCreated:true},{headers:{"Cache-Control":"no-store"}});
    result.cookies.set(SESSION_COOKIE,token,sessionCookieOptions());
    return result;
  } catch {
    return NextResponse.json({error:"Service unavailable"},{status:503});
  }
}
