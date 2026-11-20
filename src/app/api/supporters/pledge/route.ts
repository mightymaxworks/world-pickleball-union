import {queryD1} from "@/lib/supporters-db";
import {assessPledge} from "@/lib/supporter-approval-policy";
import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
export const runtime="nodejs";
const categories=["National & Regional Organisations","Clubs & Communities","Education & Development","Industry & Commercial","Institutional & Strategic"];
const regions=["Africa","Americas","Asia","Europe","Oceania"];
function error(message:string,status:number){return NextResponse.json({error:message},{status});}
export async function POST(request:Request){
 let body:Record<string,unknown>;
 try{if(Number(request.headers.get("content-length")||0)>12000)return error("Submission too large.",413);body=await request.json();}catch{return error("Invalid submission.",400);}
 const origin=request.headers.get("origin");if(origin){let hostname="";try{hostname=new URL(origin).hostname}catch{return error("Invalid origin.",403)}if(!["worldpickleball.world","www.worldpickleball.world","localhost"].includes(hostname))return error("Invalid origin.",403);}
 if(body.company_fax)return NextResponse.json({ok:true});
 const fields=["name","country","region","category","website","representative","email"];
 if(fields.some(k=>typeof body[k]!=="string"||!(body[k] as string).trim()))return error("Complete all required fields.",400);
 if(body.authority!=="yes"||body.publication!=="yes")return error("Authorisation and publication consent are required.",400);
 if(!categories.includes(String(body.category))||!regions.includes(String(body.region)))return error("Invalid category or region.",400);
 const limits=[160,100,30,100,500,160,254];if(fields.some((k,i)=>String(body[k]).length>limits[i]))return error("A field is too long.",400);
 try{const url=new URL(String(body.website));if(!["https:","http:"].includes(url.protocol))throw Error();}catch{return error("Enter a valid organisation website.",400);}
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email)))return error("Enter a valid email.",400);
 const duplicateRows=await queryD1("SELECT COUNT(*) AS n FROM supporter_pledges WHERE lower(name)=lower(?) AND lower(country)=lower(?)",[String(body.name).trim(),String(body.country).trim()]).catch(()=>null);
 if(!duplicateRows)return error("Verification temporarily unavailable.",503);
 const assessment=assessPledge({name:String(body.name),category:String(body.category),website:String(body.website),email:String(body.email),duplicateCount:Number(duplicateRows[0]?.n||0),emailVerified:false,domainVerified:false,abusePassed:false});
 const id=randomUUID();const statement="INSERT INTO supporter_pledges (id,name,country,region,category,website,representative,email,status,authority_confirmed,publication_consent,created_at,verification_status,review_reason,policy_version) VALUES (?,?,?,?,?,?,?,?, 'pending',1,1,datetime('now'),'unverified',?,?)";
 try{
 await queryD1(statement,[id,...fields.map(k=>String(body[k]).trim()),assessment.reasons.join(","),assessment.policyVersion]);
 await queryD1("INSERT INTO supporter_audit (id,pledge_id,action,actor,reason,policy_version) VALUES (?,?,?,?,?,?)",[randomUUID(),id,"submitted","system",assessment.reasons.join(","),assessment.policyVersion]);
 return NextResponse.json({ok:true,id,status:"pending",review:assessment.decision},{status:201});
 }catch{return error("We could not save the pledge. Please try again later.",503);}
}
