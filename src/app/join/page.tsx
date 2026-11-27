import { controlConfig } from "@/lib/control/access";
import { federationPilotEnabled, federationPortal } from "@/lib/federations/service";
import { isFederationSlug } from "@/lib/federations/slug";
import MembershipForm from "./form";

export const dynamic = "force-dynamic";

export default async function MembershipPage({ searchParams }: { searchParams: Promise<{ federation?: string | string[]; mode?: string | string[]; from?: string | string[] }> }) {
  const { federation, mode, from } = await searchParams;
  const returnToFederation = isFederationSlug(federation) && federationPilotEnabled() && controlConfig()
    && await federationPortal(federation, null).catch(() => null) ? federation : null;
  return <MembershipForm federation={returnToFederation} eventStudio={!returnToFederation && from === "event-studio"} initialMode={mode === "login" ? "login" : "register"} />;
}
