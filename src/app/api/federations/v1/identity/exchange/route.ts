import { controlConfig } from "@/lib/control/access";
import { controlBody, controlError, controlJson } from "@/lib/control/http";
import { exchangeIdentityGrant, federationPilotEnabled, identityToken } from "@/lib/federations/service";
import { isFederationSlug } from "@/lib/federations/slug";

export async function POST(request: Request) {
  try {
    if (!federationPilotEnabled() || !controlConfig()) return controlError(404, "Federation pilot not available.");
    // This endpoint is server-to-server. It does not accept a player session or expose CORS.
    const key = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(request.headers.get("authorization") ?? "")?.[1];
    if (!key) return controlError(401, "A registered client credential is required.");
    const body = await controlBody(request);
    if (!body || Object.keys(body).length !== 2 || !isFederationSlug(body.clientId) ||
      typeof body.code !== "string" || !identityToken.test(body.code))
      return controlError(400, "Invalid identity exchange.");
    const identity = await exchangeIdentityGrant(body.clientId, key, body.code);
    return identity ? controlJson({ version: 1, ...identity }) : controlError(403, "Identity exchange denied.");
  } catch { return controlError(503, "Identity handoff unavailable."); }
}
