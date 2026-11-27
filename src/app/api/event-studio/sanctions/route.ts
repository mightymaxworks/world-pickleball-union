import { controlBody, controlError, controlJson, isSameOrigin, signedInAccount } from "@/lib/control/http";
import { MAX_DIVISIONS } from "@/lib/events/competition";
import { isEventId } from "@/lib/events/model";
import { isHigherTier, readEvidence } from "@/lib/events/sanction";
import { organiserSanctions, sanctionReviewReady, submitSanctions } from "@/lib/events/sanction-service";
import { getEvent } from "@/lib/events/service";

export const dynamic="force-dynamic";
const unavailable=()=>controlError(503,"Higher-tier review is temporarily unavailable.");

export async function GET(request:Request) {
  try {
    const account=await signedInAccount();
    if (!account) return controlError(401,"Sign in to WPU to continue.");
    const id=new URL(request.url).searchParams.get("event");
    if (!isEventId(id)) return controlError(400,"Choose an event.");
    const event=await getEvent(account,id);
    return event ? controlJson(await organiserSanctions(account,event)) : controlError(404,"Event not available in your workspace.");
  } catch { return unavailable(); }
}

export async function POST(request:Request) {
  if (!isSameOrigin(request)) return controlError(403,"This request did not come from Event Studio.");
  try {
    const account=await signedInAccount();
    if (!account) return controlError(401,"Sign in to WPU to continue.");
    const body=await controlBody(request,16000);
    const evidence=readEvidence(body?.evidence);
    if (!body || !isEventId(body.event) || typeof body.revision!=="number" || !Number.isSafeInteger(body.revision) ||
        !isHigherTier(body.tier) || !evidence || !Array.isArray(body.divisions) || body.divisions.length<1 ||
        body.divisions.length>MAX_DIVISIONS || !body.divisions.every(isEventId) || new Set(body.divisions).size!==body.divisions.length)
      return controlError(400,"Choose a higher tier, select your divisions and complete the three review details.");
    const event=await getEvent(account,body.event);
    if (!event) return controlError(404,"Event not available in your workspace.");
    if (event.revision!==body.revision) return controlError(409,"This event changed in another session. Reload it before sending a request.");
    if (!await sanctionReviewReady()) return unavailable();
    const result=await submitSanctions(account,event,body.divisions,body.tier,evidence);
    if (result==="incomplete") return controlError(422,"Complete and save your event and division details before requesting review.");
    if (result==="conflict") return controlError(409,"An eligible selection already has a request or sanction at this level, or the event changed. Reload the requests and check your divisions.");
    return controlJson(await organiserSanctions(account,event),201);
  } catch { return unavailable(); }
}
