import { accessEmail, controlConfig, identityMatchesAccess } from "@/lib/control/access";
import { affiliationWorkspace, decideAffiliation, proposeAffiliation } from "@/lib/control/affiliations";
import { caseIdPattern, controlBody, controlError, controlJson, isSameOrigin, signedInAccount } from "@/lib/control/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const unavailable = () => controlError(409, "The case or request is unavailable for this action.");
const serviceError = () => controlError(503, "WPU Control is temporarily unavailable.");

async function authorize(request: Request) {
  const config = controlConfig();
  if (!config) return { error: controlError(404, "Pilot not available.") };
  const account = await signedInAccount();
  if (!account) return { error: controlError(401, "Sign in to your WPU account first.") };
  const email = accessEmail(request.headers.get("cf-access-jwt-assertion"), config);
  if (!email || !await identityMatchesAccess(account, email)) return { error: controlError(403, "Staff verification does not match this account.") };
  return { account };
}

export async function GET(request: Request) {
  try {
    const auth = await authorize(request);
    if ("error" in auth) return auth.error;
    const result = await affiliationWorkspace(auth.account);
    return result ? controlJson(result) : controlError(403, "No active affiliation role is assigned to this account.");
  } catch { return serviceError(); }
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return controlError(403, "Forbidden.");
    const auth = await authorize(request);
    if ("error" in auth) return auth.error;
    const body = await controlBody(request);
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (!body || reason.length < 3 || reason.length > 500 || /[\u0000-\u001f\u007f]/.test(reason)) return controlError(400, "Enter a reason of 3 to 500 characters.");
    if (body.action === "propose") {
      if (Object.keys(body).some(key => !["action", "organisationId", "playerCode", "reason"].includes(key)) ||
          typeof body.organisationId !== "string" || body.organisationId.length < 1 || body.organisationId.length > 200 ||
          typeof body.playerCode !== "string" || !/^WPU-[0-9A-F]{32}$/.test(body.playerCode.trim().toUpperCase())) return controlError(400, "Select an organisation and enter a complete WPU Player ID.");
      const id = await proposeAffiliation(auth.account, body.organisationId, body.playerCode.trim().toUpperCase(), reason);
      return id ? controlJson({ id, state: "awaiting_player" }, 201) : unavailable();
    }
    if ((body.action !== "approve" && body.action !== "reject" && body.action !== "revoke") ||
      typeof body.id !== "string" || !caseIdPattern.test(body.id) ||
      Object.keys(body).some(key => !["action", "id", "reason"].includes(key))) return controlError(400, "Invalid case decision.");
    return await decideAffiliation(auth.account, body.id, body.action, reason) ? controlJson({ ok: true }) : unavailable();
  } catch { return serviceError(); }
}
