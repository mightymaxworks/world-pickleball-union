import { accessEmail, controlConfig } from "@/lib/control/access";
import { controlBody, controlError, controlJson, isSameOrigin, signedInAccount } from "@/lib/control/http";
import { canPublishFederation, changeFederationActivation, federationActivationCandidates } from "@/lib/federations/activation";
import { federationPilotEnabled } from "@/lib/federations/service";
import { isFederationSlug } from "@/lib/federations/slug";

export const dynamic = "force-dynamic";
const unavailable = () => controlError(503, "Federation activation is temporarily unavailable.");
async function authorize(request: Request) {
  const config = federationPilotEnabled() ? controlConfig() : null;
  if (!config) return controlError(404, "Federation activation is not available.");
  const account = await signedInAccount();
  if (!account) return controlError(401, "Sign in to your WPU account first.");
  const email = accessEmail(request.headers.get("cf-access-jwt-assertion"), config, "api");
  if (!email || !await canPublishFederation({account,email})) return controlError(403, "No federation publication access.");
  return {account,email};
}

export async function GET(request: Request) {
  try {
    const staff = await authorize(request);
    if (staff instanceof Response) return staff;
    const params = new URL(request.url).searchParams;
    const q = (params.get("q") ?? "").trim();
    const offset = params.get("offset") ?? "0";
    if (q.length > 160 || /\p{Cc}/u.test(q) || !/^\d{1,6}$/.test(offset)) return controlError(400, "Invalid federation search.");
    return controlJson(await federationActivationCandidates(staff,q,Number(offset)));
  } catch { return unavailable(); }
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return controlError(403, "Forbidden.");
    const staff = await authorize(request);
    if (staff instanceof Response) return staff;
    const body = await controlBody(request);
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    const slug = body?.slug === undefined ? null : body.slug;
    const email = body?.operatorEmail === undefined ? null : body.operatorEmail;
    if (!body || Object.keys(body).some(key => !["action","organisationId","revision","reason","slug","operatorEmail","confirmed"].includes(key))
      || (body.action !== "open" && body.action !== "paused") || typeof body.organisationId !== "string" ||
      !body.organisationId || body.organisationId.length > 200 ||
      typeof body.revision !== "number" || !Number.isSafeInteger(body.revision) || body.revision < 0 ||
      reason.length < 3 || reason.length > 500 || /\p{Cc}/u.test(reason) ||
      (slug !== null && !isFederationSlug(slug)) || (email !== null && (typeof email !== "string" ||
        email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) ||
      (body.action === "open" ? body.confirmed !== true : slug !== null || email !== null || body.confirmed !== undefined))
      return controlError(400, "Check the action, federation details and confirmation.");
    const result = await changeFederationActivation(staff,{ action:body.action,organisationId:body.organisationId,
      revision:body.revision,reason,slug,operatorEmail:email?.toLowerCase() ?? null });
    return result ? controlJson(result) : controlError(409, "No change made. Refresh the federation and check the link, existing operator or verified operator email.");
  } catch { return unavailable(); }
}
