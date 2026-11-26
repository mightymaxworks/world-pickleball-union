import { accessEmail, controlConfig } from "@/lib/control/access";
import { controlBody, controlError, controlJson, isSameOrigin, signedInAccount } from "@/lib/control/http";
import { federationAdminScopes, federationPilotEnabled, federationRoster, setRosterStatus } from "@/lib/federations/service";
import { isFederationSlug } from "@/lib/federations/slug";

export const dynamic = "force-dynamic";

async function adminFor(request: Request) {
  const config = federationPilotEnabled() ? controlConfig() : null;
  if (!config) return controlError(404, "Federation pilot not available.");
  const account = await signedInAccount();
  if (!account) return controlError(401, "Sign in to your WPU account first.");
  const email = accessEmail(request.headers.get("cf-access-jwt-assertion"), config, "api");
  if (!email) return controlError(403, "Staff verification required.");
  return { account, email };
}

export async function GET(request: Request) {
  try {
    const admin = await adminFor(request);
    if (admin instanceof Response) return admin;
    const params = new URL(request.url).searchParams;
    const slug = params.get("federation");
    const after = params.get("after") ?? "";
    if ((slug !== null && !isFederationSlug(slug)) || (after && !/^affiliation:[0-9a-f-]{36}$/.test(after)))
      return controlError(400, "Invalid federation or roster cursor.");
    const scopes = await federationAdminScopes(admin);
    if (!scopes.length || (slug && !scopes.some(scope => scope.slug === slug)))
      return controlError(403, "No roster access for this federation.");
    if (!slug) return controlJson({ version: 1, federations: scopes });
    return controlJson({ version: 1, federation: slug, ...await federationRoster(admin, slug, after) });
  } catch { return controlError(503, "Roster unavailable."); }
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return controlError(403, "Forbidden.");
    const admin = await adminFor(request);
    if (admin instanceof Response) return admin;
    const body = await controlBody(request);
    if (!body || Object.keys(body).length !== 3 || !isFederationSlug(body.federation) ||
      typeof body.playerId !== "string" || !/^WPU-[A-F0-9]{32}$/.test(body.playerId) ||
      (body.rosterStatus !== "listed" && body.rosterStatus !== "on_hold"))
      return controlError(400, "Invalid roster update.");
    const scopes = await federationAdminScopes(admin);
    if (!scopes.some(scope => scope.slug === body.federation))
      return controlError(403, "No roster access for this federation.");
    return await setRosterStatus(admin, body.federation, body.playerId, body.rosterStatus)
      ? controlJson({ version: 1, ok: true })
      : controlError(409, "No roster change was made. Refresh and check the entry.");
  } catch { return controlError(503, "Roster unavailable."); }
}
