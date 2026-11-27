import { controlBody, controlError, controlJson, isSameOrigin, signedInAccount } from "@/lib/control/http";
import { isEventId, isOrganisationId, parseDraft } from "@/lib/events/model";
import { changeEvent, createEvent, eventStudioReady, listEvents, listOrganisations } from "@/lib/events/service";

export const dynamic="force-dynamic";

export async function GET() {
  try {
    const account=await signedInAccount();
    if (!account) return controlError(401,"Sign in to WPU to open Event Studio.");
    if (!await eventStudioReady()) return controlError(503,"Event Studio is not available yet.");
    const [organisations,events]=await Promise.all([listOrganisations(account),listEvents(account)]);
    return controlJson({organisations,events});
  } catch { return controlError(503,"Event Studio is temporarily unavailable. Try again shortly."); }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return controlError(403,"This request did not come from Event Studio.");
  try {
    const account=await signedInAccount();
    if (!account) return controlError(401,"Your session has ended. Sign in to WPU and try again.");
    if (!await eventStudioReady()) return controlError(503,"Event Studio is not available yet.");
    const body=await controlBody(request,96000);
    if (!body) return controlError(400,"The event could not be read. Check the fields and try again.");
    if (body.action==="create") {
      const draft=parseDraft(body.draft);
      if (!draft || !isOrganisationId(body.organisation)) return controlError(400,"Choose an organisation and check the event fields.");
      const event=await createEvent(account,body.organisation,draft);
      return event ? controlJson({event},201) : controlError(404,"Organisation not available in your workspace.");
    }
    const {action,id,revision}=body;
    if ((action!=="save" && action!=="publish" && action!=="unpublish") || !isEventId(id)
        || typeof revision!=="number" || !Number.isSafeInteger(revision) || revision<1)
      return controlError(400,"That event change is not valid.");
    const draft=action==="save" ? parseDraft(body.draft) : undefined;
    if (draft===null) return controlError(400,"Check the event fields before saving.");
    const result=await changeEvent(account,id,revision,action,draft);
    if (result.status==="ok") return controlJson({event:result.event});
    if (result.status==="missing") return controlError(404,"Event not available in your workspace.");
    if (result.status==="stale") return controlError(409,"This event has changed in another session. Reload before applying your update.");
    return controlJson({error:result.issues.join(" ")},422);
  } catch { return controlError(503,"The change could not be confirmed. Reload before trying again."); }
}
