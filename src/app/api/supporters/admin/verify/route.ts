import {getCloudflareContext} from "@opennextjs/cloudflare";
import {NextResponse} from "next/server";
import {randomUUID,timingSafeEqual} from "node:crypto";
import {queryD1,batchD1} from "@/lib/supporters-db";

export const runtime="nodejs";
export const dynamic="force-dynamic";

async function authorised(request:Request):Promise<boolean>{
 let binding:string|undefined;
 try{binding=(getCloudflareContext().env as unknown as {WPU_SUPPORTERS_ADMIN_TOKEN?:string}).WPU_SUPPORTERS_ADMIN_TOKEN;}catch{/* Non-Worker test runtime */}
 const secret=binding||process.env.WPU_SUPPORTERS_ADMIN_TOKEN;
 const value=request.headers.get("authorization")?.replace(/^Bearer /,"");
 if(!secret||!value)return false;
 const a=Buffer.from(value),b=Buffer.from(secret);
 return a.length===b.length&&timingSafeEqual(a,b);
}

/** Human evidence review only; this endpoint never approves or publishes. */
export async function POST(request:Request){
 if(!await authorised(request))return NextResponse.json({error:"Unauthorized"},{status:401});
 let body:unknown;
 try{body=await request.json();}catch{return NextResponse.json({error:"Invalid JSON"},{status:400});}
 if(!body||typeof body!=="object"||Array.isArray(body))return NextResponse.json({error:"Invalid submission"},{status:400});
 const data=body as Record<string,unknown>;
 if(typeof data.id!=="string"||!/^[0-9a-f-]{36}$/i.test(data.id))return NextResponse.json({error:"Invalid pledge ID"},{status:400});
 if(typeof data.evidenceUrl!=="string"||data.evidenceUrl.length>500)return NextResponse.json({error:"Evidence URL required"},{status:400});
 if(typeof data.note!=="string"||data.note.trim().length<20||data.note.length>500)return NextResponse.json({error:"Document verification rationale (20–500 characters)"},{status:400});
 let url:URL;
 try{url=new URL(data.evidenceUrl);if(url.protocol!=="https:"||!url.hostname.includes("."))throw Error();}catch{return NextResponse.json({error:"HTTPS evidence URL required"},{status:400});}
 const rationale=JSON.stringify({evidenceUrl:url.toString(),note:data.note.trim()});
 try{
  const rows=await queryD1("SELECT id FROM supporter_pledges WHERE id=? AND status='pending' AND verification_status='unverified'",[data.id]);
  if(!rows.length)return NextResponse.json({error:"Pledge not found or no longer eligible"},{status:404});
  await batchD1([
   {sql:"UPDATE supporter_pledges SET verification_status='verified',review_reason=? WHERE id=? AND status='pending' AND verification_status='unverified'",params:[rationale,data.id]},
   {sql:"INSERT INTO supporter_audit (id,pledge_id,action,actor,reason,policy_version) SELECT ?,?,'verified','authorised-admin',?,'wpu-supporters-v1' WHERE changes()=1",params:[randomUUID(),data.id,rationale]}
  ]);
  return NextResponse.json({ok:true,verification_status:"verified",publication_status:"pending"});
 }catch{return NextResponse.json({error:"Verification could not be saved"},{status:503});}
}
