import { accessEmail, controlConfig } from "@/lib/control/access";
import { controlError, signedInAccount } from "@/lib/control/http";
import { federationPilotEnabled } from "./service";

export async function federationAdminFor(request: Request) {
  const config = federationPilotEnabled() ? controlConfig() : null;
  if (!config) return controlError(404, "Federation pilot not available.");
  const account = await signedInAccount();
  if (!account) return controlError(401, "Sign in to your WPU account first.");
  const email = accessEmail(request.headers.get("cf-access-jwt-assertion"), config, "api");
  if (!email) return controlError(403, "Staff verification required.");
  return { account, email };
}
