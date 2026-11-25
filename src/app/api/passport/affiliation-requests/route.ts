import { controlConfig } from "@/lib/control/access";
import { playerAffiliationWorkspace, requestOwnAffiliation, respondToAffiliation } from "@/lib/control/affiliations";
import { caseIdPattern, controlBody, controlError, controlJson, isSameOrigin, signedInAccount } from "@/lib/control/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!controlConfig()) return controlError(404, "Pilot not available.");
    const account = await signedInAccount();
    if (!account) return controlError(401, "Sign in to your WPU account first.");
    return controlJson(await playerAffiliationWorkspace(account));
  } catch { return controlError(503, "Affiliation requests are temporarily unavailable."); }
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return controlError(403, "Forbidden.");
    if (!controlConfig()) return controlError(404, "Pilot not available.");
    const account = await signedInAccount();
    if (!account) return controlError(401, "Sign in to your WPU account first.");
    const body = await controlBody(request);
    if (body?.action === "request") {
      if (Object.keys(body).some(key => !["action", "organisationId"].includes(key)) ||
        typeof body.organisationId !== "string" || body.organisationId.length < 1 || body.organisationId.length > 200)
        return controlError(400, "Choose an available organisation.");
      const id = await requestOwnAffiliation(account, body.organisationId);
      return id ? controlJson({ id, state: "awaiting_review" }, 201)
        : controlError(409, "An affiliation already exists or this organisation is not accepting requests.");
    }
    if (!body || Object.keys(body).some(key => !["action", "id"].includes(key)) ||
      typeof body.id !== "string" || !caseIdPattern.test(body.id) ||
      (body.action !== "accept" && body.action !== "decline")) return controlError(400, "Invalid affiliation response.");
    return await respondToAffiliation(account, body.id, body.action === "accept")
      ? controlJson({ ok: true }) : controlError(409, "This request is no longer available.");
  } catch { return controlError(503, "Affiliation requests are temporarily unavailable."); }
}
