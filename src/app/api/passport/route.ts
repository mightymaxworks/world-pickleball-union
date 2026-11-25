import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { accountForSession, SESSION_COOKIE } from "@/lib/auth/session";
import { parsePassportPatch, type PassportProfile, type ProfileChanges } from "@/lib/passport/profile";
import { isResidenceCountry } from "@/lib/passport/regions";
import { controlConfig } from "@/lib/control/access";
import { queryD1 } from "@/lib/supporters-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };
const profileColumns = "display_name,given_name,family_name,country_code,residence_locality,gender";
const writableColumns: Record<keyof ProfileChanges, string> = {
  name: "display_name",
  givenName: "given_name",
  familyName: "family_name",
  residenceCountry: "country_code",
  locality: "residence_locality",
  gender: "gender",
};

const failure = (error: string, status: number) => NextResponse.json({ error }, { status, headers });
const optionalText = (value: unknown) => typeof value === "string" && value ? value : null;
function profileFromRow(row: Record<string, unknown>): PassportProfile {
  return {
    name: String(row.display_name),
    givenName: optionalText(row.given_name),
    familyName: optionalText(row.family_name),
    residenceCountry: optionalText(row.country_code),
    locality: optionalText(row.residence_locality),
    gender: row.gender === "male" || row.gender === "female" ? row.gender : null,
  };
}

export async function GET() {
  try {
    const jar = await cookies();
    const accountId = await accountForSession(jar.get(SESSION_COOKIE)?.value);
    if (!accountId) return failure("Authentication required", 401);
    const rows = await queryD1(
      `SELECT p.display_name,p.given_name,p.family_name,p.country_code,p.residence_locality,p.gender,
       pp.public_player_code,pp.visibility,m.status AS membership_status,m.valid_from AS member_since,
       EXISTS(SELECT 1 FROM wpu_auth_emails e WHERE e.account_id=a.id AND e.verified_at IS NOT NULL) AS email_verified
       FROM wpu_accounts a JOIN wpu_persons p ON p.id=a.person_id
       JOIN wpu_player_profiles pp ON pp.person_id=p.id
       LEFT JOIN wpu_memberships m ON m.person_id=p.id AND m.membership_type='individual'
         AND m.organisation_id IS NULL AND m.status='active'
         AND (m.valid_from IS NULL OR julianday(m.valid_from)<=julianday('now'))
         AND (m.valid_until IS NULL OR julianday(m.valid_until)>julianday('now'))
       WHERE a.id=? AND a.status='active'
       ORDER BY m.valid_from IS NULL, m.valid_from, m.id LIMIT 1`, [accountId]);
    if (!rows.length) return failure("Passport unavailable", 404);
    const row = rows[0];
    const affiliations = await queryD1(
      `SELECT o.id,o.name,o.organisation_type,m.status,m.valid_from,m.valid_until
       FROM wpu_accounts a JOIN wpu_memberships m ON m.person_id=a.person_id
       JOIN wpu_organisations o ON o.id=m.organisation_id
       WHERE a.id=? AND a.status='active' AND m.membership_type='organisation'
       ORDER BY o.name,m.created_at DESC,m.id`, [accountId]);
    return NextResponse.json({
      passport: {
        ...profileFromRow(row),
        playerCode: row.public_player_code,
        visibility: row.visibility,
        membershipStatus: row.membership_status || "inactive",
        memberSince: optionalText(row.member_since),
        emailVerified: Number(row.email_verified) === 1,
        ...(controlConfig() ? { affiliationRequestsEnabled: true } : {}),
        affiliations: affiliations.map(a => ({
          organisationId: a.id, name: a.name, type: a.organisation_type, status: a.status,
          validFrom: a.valid_from, validUntil: a.valid_until,
        })),
      },
    }, { headers });
  } catch {
    return failure("Service temporarily unavailable", 503);
  }
}

export async function PATCH(request: Request) {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin) return failure("Forbidden", 403);
    const jar = await cookies();
    const accountId = await accountForSession(jar.get(SESSION_COOKIE)?.value);
    if (!accountId) return failure("Authentication required", 401);
    const reader = request.body?.getReader();
    if (!reader) return failure("Invalid request", 400);
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let size = 0;
    let raw = "";
    let body: unknown;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 4096) {
          await reader.cancel();
          return failure("Request too large", 413);
        }
        raw += decoder.decode(value, { stream: true });
      }
      body = JSON.parse(raw + decoder.decode());
    } catch {
      return failure("Invalid request", 400);
    } finally {
      reader.releaseLock();
    }
    const patch = parsePassportPatch(body, isResidenceCountry);
    if (patch.kind === "invalid") return failure(patch.error, 400);
    if (patch.kind === "privacy") {
      const updated = await queryD1(`UPDATE wpu_player_profiles SET visibility='private'
        WHERE person_id=(SELECT person_id FROM wpu_accounts WHERE id=? AND status='active')
        RETURNING person_id`, [accountId]);
      if (!updated.length) return failure("Profile unavailable", 404);
      return NextResponse.json({ ok: true, visibility: "private" }, { headers });
    }
    const keys = Object.keys(writableColumns) as (keyof ProfileChanges)[];
    const changed = keys.filter(key => patch.fields[key] !== undefined);
    const assignments = changed.map(key => writableColumns[key] + "=?").join(",");
    const updated = await queryD1(
      `UPDATE wpu_persons SET ${assignments},updated_at=datetime('now')
       WHERE id=(SELECT person_id FROM wpu_accounts WHERE id=? AND status='active')
       RETURNING ${profileColumns}`,
      [...changed.map(key => patch.fields[key]), accountId]);
    if (!updated.length) return failure("Profile unavailable", 404);
    const profile = profileFromRow(updated[0]);
    return NextResponse.json({ ok: true, name: profile.name, profile }, { headers });
  } catch {
    return failure("Service temporarily unavailable", 503);
  }
}
