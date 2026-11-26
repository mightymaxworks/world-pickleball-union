import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import { controlBody, caseIdPattern, isSameOrigin } from "@/lib/control/http";
import { isIntakeOrganisationType } from "@/lib/organisation-intake-types";
import { isResidenceCountry } from "@/lib/passport/regions";
import {queryD1} from "@/lib/supporters-db";
export const runtime="nodejs";
const allowed=["membership","competition"];
function bad(message:string,status=400){return NextResponse.json({error:message},{status});}
export async function POST(req:Request){
 const data = await controlBody(req, 12000);
 if (!data) return bad("Invalid request or submission too large.");
 if (data.form_type === "organisation") return organisationRequest(req, data);
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

async function organisationRequest(req: Request, data: Record<string, unknown>) {
 if (!isSameOrigin(req)) return bad("Invalid origin", 403);
 const reference = data.reference;
 if (typeof reference !== "string" || !caseIdPattern.test(reference)) return bad("Invalid submission reference.");
 const receipt = () => NextResponse.json({ reference }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
 if (data.company_fax) return receipt();
 const clean = (value: unknown, max: number) => typeof value === "string" && value.length <= max ? value.trim() : null;
 const name = clean(data.organisation, 160), country = clean(data.country, 2);
 const contact = clean(data.contactName, 160), role = clean(data.role, 120);
 const email = clean(data.email, 254), website = clean(data.website ?? "", 500), message = clean(data.message, 2000);
 if (!name || !country || !isResidenceCountry(country) || !contact || !role || !message || website === null ||
     !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !isIntakeOrganisationType(data.organisationType) ||
     data.consent !== "yes" || [name,contact,role].some(value => /\p{Cc}/u.test(value)))
   return bad("Please check the required organisation and contact details.");
 if (website) {
   try {
     const url = new URL(website);
     if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return bad("Use a public http or https website.");
   } catch { return bad("Use a valid website or leave it blank."); }
 }
 try {
   await queryD1(`INSERT INTO wpu_inquiries
     (id,form_type,organisation,country,contact_name,email,details_json,consent,status)
     VALUES (?,'membership',?,?,?,?,?,1,'pending') ON CONFLICT(id) DO NOTHING`,
   [reference,name,country,contact,email,JSON.stringify({ organisationType:data.organisationType, role,website,message })]);
   return receipt();
 } catch { return bad("Submission service is temporarily unavailable. Please try later.",503); }
}
