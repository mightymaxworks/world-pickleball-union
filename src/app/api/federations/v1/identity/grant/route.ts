import { controlConfig } from "@/lib/control/access";
import { controlBody, controlError, controlJson, isSameOrigin, signedInAccount } from "@/lib/control/http";
import { federationPilotEnabled, identityGrantSeconds, issueIdentityGrant } from "@/lib/federations/service";
import { isFederationSlug } from "@/lib/federations/slug";

export async function POST(request: Request) {
  try {
    if (!federationPilotEnabled() || !controlConfig()) return controlError(404, "Federation pilot not available.");
    if (!isSameOrigin(request)) return controlError(403, "Forbidden.");
    const account = await signedInAccount();
    if (!account) return controlError(401, "Sign in to your WPU account first.");
    const body = await controlBody(request);
    if (!body || Object.keys(body).length !== 2 || !isFederationSlug(body.clientId) || body.consent !== true)
      return controlError(400, "Explicit consent for a named client is required.");
    const code = await issueIdentityGrant(account, body.clientId);
    return code ? controlJson({ code, expiresIn: identityGrantSeconds }, 201)
      : controlError(403, "Identity handoff is not available for this account and client.");
  } catch { return controlError(503, "Identity handoff unavailable."); }
}
