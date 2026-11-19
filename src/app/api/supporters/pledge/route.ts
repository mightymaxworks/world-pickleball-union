import {NextResponse} from "next/server";
import {createHmac,randomUUID,timingSafeEqual} from "node:crypto";
export const runtime="nodejs";
const categories=["National & Regional Organisations","Clubs & Communities","Education & Development","Industry & Commercial","Institutional & Strategic"];
const regions=["Africa","Americas","Asia","Europe","Oceania"];
function error(message:string,status:number){return NextResponse.json({error:message},{status});}
export async function POST(request:Request){
 const env=process.env;
 if(!env.WPU_CF_ACCOUNT_ID||!env.WPU_CF_D1_DATABASE_ID||!env.WPU_CF_API_TOKEN)return error("Pledge submissions are not yet enabled. Please try again later.",503);
 let body:Record<string,unknown>;
 try{body=await request.json();}catch{return error("Invalid submission.",400);}
 if(body.company_fax)return NextResponse.json({ok:true});
 const fields=["name","country","region","category","website","representative","email"];
 if(fields.some(k=>typeof body[k]!=="string"||!(body[k] as string).trim()))return error("Complete all required fields.",400);
 if(body.authority!=="yes"||body.publication!=="yes")return error("Authorisation and publication consent are required.",400);
 if(!categories.includes(String(body.category))||!regions.includes(String(body.region)))return error("Invalid category or region.",400);
 const limits=[160,100,30,100,500,160,254];if(fields.some((k,i)=>String(body[k]).length>limits[i]))return error("A field is too long.",400);
 try{const url=new URL(String(body.website));if(!["https:","http:"].includes(url.protocol))throw Error();}catch{return error("Enter a valid organisation website.",400);}
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email)))return error("Enter a valid email.",400);
 const id=randomUUID();const statement="INSERT INTO supporter_pledges (id,name,country,region,category,website,representative,email,status,authority_confirmed,publication_consent,created_at) VALUES (?,?,?,?,?,?,?,?, 'pending',1,1,datetime('now'))";
 try{
 const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.WPU_CF_ACCOUNT_ID}/d1/database/${env.WPU_CF_D1_DATABASE_ID}/query`,{method:"POST",headers:{"Authorization":`Bearer ${env.WPU_CF_API_TOKEN}`,"Content-Type":"application/json"},body:JSON.stringify({sql:statement,params:[id,...fields.map(k=>String(body[k]).trim())]}),cache:"no-store"});
 const result=await response.json() as {success?:boolean;errors?:unknown[]};
 if(!response.ok||!result.success)throw new Error("Database unavailable");
 return NextResponse.json({ok:true,id},{status:201});
 }catch{return error("We could not save the pledge. Please try again later.",503);}
}
