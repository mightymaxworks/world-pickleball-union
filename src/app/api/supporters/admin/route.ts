import {NextResponse} from "next/server";
import {timingSafeEqual,randomUUID} from "node:crypto";
import {queryD1} from "@/lib/supporters-db";
export const runtime="nodejs";
export const dynamic="force-dynamic";
function authorised(req:Request){
 const secret=process.env.WPU_SUPPORTERS_ADMIN_TOKEN;
 const value=req.headers.get("authorization")?.replace(/^Bearer /,"");
 if(!secret||!value)return false;
 const a=Buffer.from(value),b=Buffer.from(secret);
 return a.length===b.length&&timingSafeEqual(a,b);
}
export async function GET(req:Request){
 if(!authorised(req))return NextResponse.json({error:"Unauthorized"},{status:401});
 try{return NextResponse.json({pledges:await queryD1("SELECT id,name,country,region,category,website,representative,email,status,created_at FROM supporter_pledges WHERE status='pending' ORDER BY created_at ASC LIMIT 100")});}
 catch{return NextResponse.json({error:"Database unavailable"},{status:503});}
}
export async function PATCH(req:Request){
 if(!authorised(req))return NextResponse.json({error:"Unauthorized"},{status:401});
 let body:{id?:string;decision?:string;note?:string};
 try{body=await req.json();}catch{return NextResponse.json({error:"Invalid JSON"},{status:400});}
 if(!body.id||!(/^[0-9a-f-]{36}$/i.test(body.id))||!["approved","rejected"].includes(body.decision||""))return NextResponse.json({error:"Invalid decision"},{status:400});
 try{
  const rows=await queryD1("UPDATE supporter_pledges SET status=?,reviewed_at=datetime('now'),reviewed_by='authorised-admin',review_note=? WHERE id=? AND status='pending' RETURNING id,status",[body.decision,(body.note||"").slice(0,500),body.id]);
  if(!rows.length)return NextResponse.json({error:"Pledge not found or already reviewed"},{status:404});
  await queryD1("INSERT INTO supporter_audit (id,pledge_id,action,actor,reason,policy_version) VALUES (?,?,?,?,?,?)",[randomUUID(),body.id,body.decision,"authorised-admin",(body.note||"").slice(0,500),"wpu-supporters-v1"]);
  return NextResponse.json({ok:true,status:rows[0].status});
 }catch{return NextResponse.json({error:"Database unavailable"},{status:503});}
}
