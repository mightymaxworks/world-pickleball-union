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
      `SELECT p.display_name,p.country_code,p.gender,pp.public_player_code,pp.visibility,
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
      name:row.display_name,residenceCountry:row.country_code,gender:row.gender,
      playerCode:row.public_player_code,visibility:row.visibility,
      membershipStatus:row.membership_status||"inactive",affiliations:affiliations.map(a=>({organisationId:a.id,name:a.name,type:a.organisation_type,status:a.status,validFrom:a.valid_from,validUntil:a.valid_until}))
    }},{headers});
  } catch {
    return NextResponse.json({error:"Service temporarily unavailable"},{status:503,headers});
  }
}

export async function PATCH(request: Request) {
  const headers={"Cache-Control":"private, no-store"};
  try {
    if(request.headers.get("origin")!==new URL(request.url).origin)
      return NextResponse.json({error:"Forbidden"},{status:403,headers});
    const jar=await cookies();
    const accountId=await accountForSession(jar.get(SESSION_COOKIE)?.value);
    if(!accountId)return NextResponse.json({error:"Authentication required"},{status:401,headers});
    const reader=request.body?.getReader();
    if(!reader)return NextResponse.json({error:"Invalid request"},{status:400,headers});
    let size=0;const decoder=new TextDecoder();let raw="";
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();return NextResponse.json({error:"Request too large"},{status:413,headers});}raw+=decoder.decode(value,{stream:true});}
    raw+=decoder.decode();
    let body;try{body=JSON.parse(raw);}catch{return NextResponse.json({error:"Invalid request"},{status:400,headers});}
    if(!body||typeof body!=="object"||Array.isArray(body)||Object.keys(body).some(k=>k!=="name"&&k!=="visibility"))
      return NextResponse.json({error:"Unsupported profile fields"},{status:400,headers});
    if(body.visibility!==undefined){
      if(body.visibility!=="private"||body.name!==undefined)
        return NextResponse.json({error:"Only private visibility is currently supported"},{status:400,headers});
      const updated=await queryD1(`UPDATE wpu_player_profiles SET visibility='private'
        WHERE person_id=(SELECT person_id FROM wpu_accounts WHERE id=? AND status='active')
        RETURNING person_id`,[accountId]);
      if(!updated.length)return NextResponse.json({error:"Profile unavailable"},{status:404,headers});
      return NextResponse.json({ok:true,visibility:"private"},{headers});
    }
    const name=typeof body.name==="string"?body.name.trim():"";
    if(!name||name.length>160)return NextResponse.json({error:"Enter a valid name"},{status:400,headers});
    const updated=await queryD1(
      `UPDATE wpu_persons SET display_name=?,updated_at=datetime('now')
       WHERE id=(SELECT person_id FROM wpu_accounts WHERE id=? AND status='active')
       RETURNING id`,[name,accountId]);
    if(!updated.length)return NextResponse.json({error:"Profile unavailable"},{status:404,headers});
    return NextResponse.json({ok:true,name},{headers});
  }catch{return NextResponse.json({error:"Service temporarily unavailable"},{status:503,headers});}
}
