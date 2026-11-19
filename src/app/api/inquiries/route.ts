import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {queryD1} from "@/lib/supporters-db";
export const runtime="nodejs";
const allowed=["membership","competition"];
function bad(message:string,status=400){return NextResponse.json({error:message},{status});}
export async function POST(req:Request){
 let data:Record<string,unknown>;
 try{if(Number(req.headers.get("content-length")||0)>12000)return bad("Submission too large",413);data=await req.json();}catch{return bad("Invalid request");}
 if(data.company_fax)return NextResponse.json({ok:true});
 const origin=req.headers.get("origin");if(origin&&new URL(origin).hostname!=="worldpickleball.world"&&new URL(origin).hostname!=="www.worldpickleball.world"&&new URL(origin).hostname!=="localhost")return bad("Invalid origin",403);
 const type=String(data.form_type||"");
 if(!allowed.includes(type))return bad("Invalid form type");
 const organisation=String(data.organisation||"").trim(),country=String(data.country||"").trim();
 const contact=String((type==="membership"?data.contactName:data.name)||"").trim(),email=String(data.email||"").trim();
 if(!organisation||!country||!contact||!email||data.consent!=="yes")return bad("Complete all required fields and consent");
 if([organisation,country,contact].some(s=>s.length>160)||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return bad("Invalid contact details");
 const details:Record<string,string>={};
 for(const key of (type==="membership"?["role","phone","website","message"]:["interest","date","message"])){const value=String(data[key]||"").trim();if(value.length>2000)return bad("Field too long");details[key]=value;}
 try{
  await queryD1("INSERT INTO wpu_inquiries (id,form_type,organisation,country,contact_name,email,details_json,consent,status,created_at) VALUES (?,?,?,?,?,?,?,1,'pending',datetime('now'))",[randomUUID(),type,organisation,country,contact,email,JSON.stringify(details)]);
  return NextResponse.json({ok:true},{status:201});
 }catch{return bad("Submission service is temporarily unavailable. Please try later.",503);}
}
