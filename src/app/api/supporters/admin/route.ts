import {NextResponse} from "next/server";
import {timingSafeEqual,randomUUID} from "node:crypto";
import {queryD1,batchD1} from "@/lib/supporters-db";
export const runtime="nodejs";
export const dynamic="force-dynamic";
function authorised(req:Request){
 const context=(globalThis as unknown as Record<symbol,{env?:{WPU_SUPPORTERS_ADMIN_TOKEN?:string}}|undefined>)[Symbol.for("__cloudflare-context__")];
 const secret=context?.env?.WPU_SUPPORTERS_ADMIN_TOKEN||process.env.WPU_SUPPORTERS_ADMIN_TOKEN;
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
  // A conditional insert ensures that an audit entry is created only when the
  // pending pledge is actually transitioned; D1 batch is transactional.
  const note=(body.note||"").slice(0,500);
  const eligible=await queryD1("SELECT id FROM supporter_pledges WHERE id=? AND status='pending' AND (?='rejected' OR verification_status='verified')",[body.id,body.decision]);
  if(!eligible.length)return NextResponse.json({error:"Pledge not found, already reviewed, or not independently verified"},{status:404});
  await batchD1([
   {sql:"UPDATE supporter_pledges SET status=?,reviewed_at=datetime('now'),reviewed_by='authorised-admin',review_note=? WHERE id=? AND status='pending' AND (?='rejected' OR verification_status='verified')",params:[body.decision,note,body.id,body.decision]},
   {sql:"INSERT INTO supporter_audit (id,pledge_id,action,actor,reason,policy_version) SELECT ?,?,?,?,?,? WHERE changes()=1",params:[randomUUID(),body.id,body.decision,"authorised-admin",note,"wpu-supporters-v1"]}
  ]);
  return NextResponse.json({ok:true,status:body.decision});
 }catch{return NextResponse.json({error:"Database unavailable"},{status:503});}
}
