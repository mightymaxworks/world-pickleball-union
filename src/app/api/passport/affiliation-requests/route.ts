import { controlConfig } from "@/lib/control/access";
import { affiliationInvitations, respondToAffiliation } from "@/lib/control/affiliations";
import { caseIdPattern, controlBody, controlError, controlJson, isSameOrigin, signedInAccount } from "@/lib/control/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!controlConfig()) return controlError(404, "Pilot not available.");
    const account = await signedInAccount();
    if (!account) return controlError(401, "Sign in to your WPU account first.");
    return controlJson({ invitations: await affiliationInvitations(account) });
  } catch { return controlError(503, "Affiliation requests are temporarily unavailable."); }
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return controlError(403, "Forbidden.");
    if (!controlConfig()) return controlError(404, "Pilot not available.");
    const account = await signedInAccount();
    if (!account) return controlError(401, "Sign in to your WPU account first.");
    const body = await controlBody(request);
    if (!body || Object.keys(body).some(key => !["action", "id"].includes(key)) ||
      typeof body.id !== "string" || !caseIdPattern.test(body.id) ||
      (body.action !== "accept" && body.action !== "decline")) return controlError(400, "Invalid affiliation response.");
    return await respondToAffiliation(account, body.id, body.action === "accept")
      ? controlJson({ ok: true }) : controlError(409, "This request is no longer available.");
  } catch { return controlError(503, "Affiliation requests are temporarily unavailable."); }
}
