import { controlBody, controlError, controlJson, isSameOrigin, privateHeaders } from "@/lib/control/http";
import { federationAdminFor } from "@/lib/federations/http";
import { federationAdminScopes } from "@/lib/federations/service";
import { isFederationSlug } from "@/lib/federations/slug";
import { federationRosterCsv } from "@/lib/federations/roster-export";
import {
  isRevision, isRosterStatus, memberCursorPattern, parseMemberFields, parseMemberFilters, parseRosterReason, playerIdPattern,
} from "@/lib/federations/member-fields";
import {
  federationMember, federationMembers, federationMemberWorkspaceReady, memberCsvLimit, saveFederationMember, updateFederationRosterStatus,
} from "@/lib/federations/members";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await federationAdminFor(request);
    if (admin instanceof Response) return admin;
    const params = new URL(request.url).searchParams;
    const slug = params.get("federation");
    const playerId = params.get("playerId");
    const after = params.get("after") ?? "";
    const format = params.get("format");
    const filters = parseMemberFilters(params);
    if (!isFederationSlug(slug) || !filters || (playerId !== null && !playerIdPattern.test(playerId)) ||
      (after && !memberCursorPattern.test(after)) || (format !== null && format !== "csv") ||
      (after && format) || (playerId && (after || format)))
      return controlError(400, "Invalid federation, member or roster filters.");
    if (!(await federationAdminScopes(admin)).some(scope => scope.slug === slug))
      return controlError(403, "No member access for this federation.");
    if (!await federationMemberWorkspaceReady()) return controlError(404, "Federation Members is not available yet.");
    if (playerId) {
      const member = await federationMember(admin, slug, playerId);
      return member ? controlJson({ version: 1, member }) : controlError(404, "Member is not on this federation roster.");
    }
    const result = await federationMembers(admin, slug, filters, after, format === "csv");
    if (format === "csv") {
      if (result.total > memberCsvLimit)
        return controlError(422, "More than 1,000 members match. Narrow the filters before downloading.");
      return new Response(federationRosterCsv(result.members), { headers: {
        ...privateHeaders, "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}-members.csv"`, "X-Content-Type-Options": "nosniff",
      } });
    }
    return controlJson({ version: 1, ...result });
  } catch { return controlError(503, "Federation Members is temporarily unavailable."); }
}

const only = (body: Record<string, unknown>, keys: string[]) =>
  Object.keys(body).length === keys.length && keys.every(key => Object.hasOwn(body, key));

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return controlError(403, "Forbidden.");
    const admin = await federationAdminFor(request);
    if (admin instanceof Response) return admin;
    const body = await controlBody(request);
    if (!body || !isFederationSlug(body.federation) || typeof body.playerId !== "string" ||
        !playerIdPattern.test(body.playerId) || !isRevision(body.revision)) return controlError(400, "Invalid member update.");
    if (!(await federationAdminScopes(admin)).some(scope => scope.slug === body.federation))
      return controlError(403, "No member access for this federation.");
    if (!await federationMemberWorkspaceReady()) return controlError(404, "Federation Members is not available yet.");
    const base = ["action", "federation", "playerId", "revision"];
    if (body.action === "save_details" && only(body, [...base, "membershipNumber", "club", "category", "joinedOn", "renewalOn"])) {
      const fields = parseMemberFields(body);
      if (!fields) return controlError(400, "Check the membership details. Renewal cannot be before the join date.");
      if (await saveFederationMember(admin, body.federation, body.playerId, fields, body.revision))
        return controlJson({ version: 1, ok: true });
      return controlError(409, "Details were not saved. Check that the member number is unique and refresh the record.");
    }
    if (body.action === "set_roster_status" && only(body, [...base, "status", "reason"]) && isRosterStatus(body.status)) {
      const reason = parseRosterReason(body.reason);
      if (!reason) return controlError(400, "Enter a plain-text reason of up to 240 characters.");
      if (await updateFederationRosterStatus(admin, body.federation, body.playerId, body.status, reason, body.revision))
        return controlJson({ version: 1, ok: true });
      return controlError(409, "Roster status was not changed. Refresh the record and check its current status.");
    }
    return controlError(400, "Invalid member update.");
  } catch { return controlError(503, "Federation Members is temporarily unavailable."); }
}
