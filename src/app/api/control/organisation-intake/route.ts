import { accessEmail, controlConfig } from "@/lib/control/access";
import { controlBody, controlError, controlJson, isSameOrigin, signedInAccount, caseIdPattern } from "@/lib/control/http";
import { canReviewOrganisationIntake, findIntakeOrganisations, organisationIntakeQueue, reviewOrganisationIntake } from "@/lib/control/organisation-intake";
import { isIntakeDecision } from "@/lib/organisation-intake-types";

export const dynamic = "force-dynamic";
const serviceError = () => controlError(503, "Organisation review is temporarily unavailable.");

async function authorize(request: Request) {
  const config = controlConfig();
  if (!config) return controlError(404, "Staff service is not available.");
  const account = await signedInAccount();
  if (!account) return controlError(401, "Sign in to your WPU account first.");
  const email = accessEmail(request.headers.get("cf-access-jwt-assertion"), config, "api");
  if (!email || !await canReviewOrganisationIntake({ account, email })) return controlError(403, "No organisation review access.");
  return { account, email };
}
export async function GET(request: Request) {
  try {
    const reviewer = await authorize(request);
    if (reviewer instanceof Response) return reviewer;
    const p = new URL(request.url).searchParams;
    const reference = p.get("reference");
    const filter = p.get("filter") ?? "open";
    const offset = p.get("offset") ?? "0";
    const orgSearch = p.get("findOrganisation");
    if ((reference !== null && !caseIdPattern.test(reference)) || (filter !== "open" && filter !== "completed") ||
      !/^\d{1,6}$/.test(offset) || (orgSearch !== null && (!reference || orgSearch.length > 160)))
      return controlError(400, "Invalid queue request.");
    if (reference && orgSearch !== null) return controlJson({ matches: await findIntakeOrganisations(reviewer, reference, orgSearch.trim()) });
    const data = await organisationIntakeQueue(reviewer, reference, filter, Number(offset));
    return controlJson(data);
  } catch { return serviceError(); }
}
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return controlError(403, "Forbidden.");
    const reviewer = await authorize(request);
    if (reviewer instanceof Response) return reviewer;
    const body = await controlBody(request);
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (!body || Object.keys(body).some(key => !["reference","decision","version","reason","existingId"].includes(key)) ||
       typeof body.reference !== "string" || !caseIdPattern.test(body.reference) || !isIntakeDecision(body.decision) ||
       typeof body.version !== "number" || !Number.isSafeInteger(body.version) || body.version < 0 ||
       reason.length < 3 || reason.length > 500 || /\p{Cc}/u.test(reason) ||
       (body.decision === "approve_existing" && (typeof body.existingId !== "string" || body.existingId.length < 1 || body.existingId.length > 200)))
      return controlError(400, "Check the case, decision, reason and selected organisation.");
    if (await reviewOrganisationIntake(reviewer, body.reference, body.decision, body.version, reason, String(body.existingId ?? "")))
      return controlJson({ ok: true });
    return controlError(409, "Unable to record the decision. Refresh the case, check for an existing organisation and verify the submission details.");
  } catch { return serviceError(); }
}
