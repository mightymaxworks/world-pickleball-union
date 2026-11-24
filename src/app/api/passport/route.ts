import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { accountForSession, SESSION_COOKIE } from "@/lib/auth/session";
import { queryD1 } from "@/lib/supporters-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const headers = {"Cache-Control":"private, no-store"};
  try {
    const jar = await cookies();
    const accountId = await accountForSession(jar.get(SESSION_COOKIE)?.value);
    if (!accountId) return NextResponse.json({error:"Authentication required"},{status:401,headers});
    const rows = await queryD1(
      `SELECT p.display_name,p.country_code,pp.public_player_code,pp.visibility,
       m.status AS membership_status
       FROM wpu_accounts a JOIN wpu_persons p ON p.id=a.person_id
       JOIN wpu_player_profiles pp ON pp.person_id=p.id
       LEFT JOIN wpu_memberships m ON m.person_id=p.id AND m.membership_type='individual'
         AND m.organisation_id IS NULL AND m.status='active'
         AND (m.valid_from IS NULL OR julianday(m.valid_from)<=julianday('now'))
         AND (m.valid_until IS NULL OR julianday(m.valid_until)>julianday('now'))
       WHERE a.id=? AND a.status='active' LIMIT 1`,[accountId]);
    if (!rows.length) return NextResponse.json({error:"Passport unavailable"},{status:404,headers});
    const row=rows[0];
    const affiliations=await queryD1(
      `SELECT o.id,o.name,o.organisation_type,m.status,m.valid_from,m.valid_until
       FROM wpu_accounts a JOIN wpu_memberships m ON m.person_id=a.person_id
       JOIN wpu_organisations o ON o.id=m.organisation_id
       WHERE a.id=? AND a.status='active' AND m.membership_type='organisation'
       ORDER BY o.name,m.created_at DESC`,[accountId]);
    return NextResponse.json({passport:{
      name:row.display_name,residenceCountry:row.country_code,
      playerCode:row.public_player_code,visibility:row.visibility,
      membershipStatus:row.membership_status||"inactive",affiliations:affiliations.map(a=>({organisationId:a.id,name:a.name,type:a.organisation_type,status:a.status,validFrom:a.valid_from,validUntil:a.valid_until}))
    }},{headers});
  } catch {
    return NextResponse.json({error:"Service temporarily unavailable"},{status:503,headers});
  }
}
