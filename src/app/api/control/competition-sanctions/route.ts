import { accessEmail, controlConfig } from "@/lib/control/access";
import { controlBody, controlError, controlJson, isSameOrigin, signedInAccount } from "@/lib/control/http";
import { isEventId } from "@/lib/events/model";
import { canReviewSanctions, decideSanction, sanctionQueue } from "@/lib/events/sanction-service";

export const dynamic="force-dynamic";
const unavailable=()=>controlError(503,"Competition sanction review is temporarily unavailable.");

async function authorize(request:Request) {
  const config=controlConfig();
  if (!config) return controlError(404,"Staff service is not available.");
  const account=await signedInAccount();
  if (!account) return controlError(401,"Sign in to your WPU account first.");
  const email=accessEmail(request.headers.get("cf-access-jwt-assertion"),config,"api");
  if (!email || !await canReviewSanctions({account,email})) return controlError(403,"No competition review access.");
  return {account,email};
}

export async function GET(request:Request) {
  try {
    const reviewer=await authorize(request);
    if (reviewer instanceof Response) return reviewer;
    const query=new URL(request.url).searchParams;
    const filter=query.get("filter")??"pending", offset=query.get("offset")??"0";
    if ((filter!=="pending" && filter!=="history") || !/^\d{1,5}$/.test(offset)) return controlError(400,"Invalid queue request.");
    return controlJson(await sanctionQueue(reviewer,filter==="history",Number(offset)));
  } catch { return unavailable(); }
}

export async function POST(request:Request) {
  if (!isSameOrigin(request)) return controlError(403,"Forbidden.");
  try {
    const reviewer=await authorize(request);
    if (reviewer instanceof Response) return reviewer;
    const body=await controlBody(request);
    const note=typeof body?.note==="string"?body.note.trim():"";
    if (!body || !isEventId(body.id) || (body.decision!=="approved" && body.decision!=="changes_requested") ||
      (body.decision==="changes_requested" && !note) || note.length>500 || /\p{Cc}/u.test(note.replaceAll("\n","").replaceAll("\r","").replaceAll("\t","")))
      return controlError(400,"Choose a decision. If changes are needed, explain what to change.");
    if (!await decideSanction(reviewer,body.id,body.decision,note))
      return controlError(409,"The request has already been decided or the division changed. Refresh before deciding.");
    return controlJson({ok:true});
  } catch { return unavailable(); }
}
