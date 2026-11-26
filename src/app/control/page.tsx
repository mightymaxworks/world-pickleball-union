import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { accessEmail, controlConfig, identityMatchesAccess } from "@/lib/control/access";
import { signedInAccount } from "@/lib/control/http";
import { hasAffiliationRole } from "@/lib/control/affiliations";
import { federationAdminScopes, federationPilotEnabled } from "@/lib/federations/service";
import { federationMemberWorkspaceReady } from "@/lib/federations/members";
import { canReviewOrganisationIntake } from "@/lib/control/organisation-intake";
import { canPublishFederation } from "@/lib/federations/activation";
import FederationActivationWorkspace from "./federation-activation-workspace";
import FederationMembers from "./federation-members";
import FederationRosterPanel from "./federation-roster";
import {
  controlHref, OperationsActivity, OperationsOverview, OrganisationRequests, Organisations, WorkspaceUnavailable, type ControlQuery,
} from "./operations-workspace";
import ControlWorkspace from "./workspace";
import "./control.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "WPU Control", robots: { index: false, follow: false } };

const navigation = [
  ["overview","Overview"],
  ["requests","Organisation requests"],
  ["organisations","Organisations"],
  ["activity","Activity"],
  ["activation","Federation setup"],
  ["affiliations","Affiliation requests"],
  ["members","Federation members"],
] as const;

export default async function ControlPage({searchParams}: {searchParams: Promise<ControlQuery>}) {
  const config = controlConfig();
  if (!config) notFound();
  const email = accessEmail((await headers()).get("cf-access-jwt-assertion"), config, "page");
  const account = email ? await signedInAccount().catch(() => null) : null;
  const staff = account && email && await identityMatchesAccess(account,email).catch(() => false) ? {account,email} : null;
  const query = await searchParams;
  const federationEnabled = federationPilotEnabled();
  const [scopes, intake, activation, affiliations]: [Awaited<ReturnType<typeof federationAdminScopes>>,boolean,boolean,boolean] = staff ? await Promise.all([
    federationEnabled ? federationAdminScopes(staff).catch(() => []) : [],
    canReviewOrganisationIntake(staff).catch(() => false),
    federationEnabled ? canPublishFederation(staff).catch(() => false) : false,
    hasAffiliationRole(staff.account).catch(() => false),
  ]) : [[],false,false,false] as const;
  const network = intake && activation;
  const allowed = {
    overview:network, requests:intake, organisations:network, activity:network,
    activation:activation && !network, affiliations, members:scopes.length>0,
  };
  const nav = navigation.filter(([key]) => allowed[key]);
  const requested = nav.find(([key]) => key === query.view)?.[0] ??
    (query.view==="organisations" && intake && typeof query.id==="string" && query.id ? "organisations" : null);
  const view = requested ?? (network ? "overview" : intake ? "requests" : scopes.length>0 ? "members" : nav[0]?.[0]);

  return <main className="wc">
    <header className="wc-header"><Image src="/brand/wpu-logo-approved.png" alt="World Pickleball Union" width={150} height={50} unoptimized /><Link href="/passport">Player Passport</Link></header>
    <div className="wc-content wc-operations">
      <p className="wc-label">Operations</p><h1>WPU Control</h1>
      {!email ? <section className="wc-box">
        <h2>Staff verification required</h2>
        <p>Open this workspace through the WPU staff access portal. A WPU member sign-in on its own does not grant staff access.</p>
      </section> : !staff ? <section className="wc-box"><h2>{account ? "Accounts don’t match" : "Sign in to your WPU account"}</h2>
        <p>Use the same verified email for your WPU account and staff access.</p>
        <Link className="wc-link-button" href="/join?mode=login">Open WPU sign-in</Link>
      </section> : !view ? <section className="wc-box"><h2>No workspace assigned</h2>
        <p>Your staff identity is verified, but it does not have an active workspace role. Contact your WPU administrator.</p>
      </section> : <>
        <nav className="wc-tabs" aria-label="WPU Control navigation">
          {nav.map(([key,label]) => <Link prefetch={false} key={key} href={controlHref(key)} aria-current={key===view ? "page" : undefined}>{label}</Link>)}
        </nav>
        {await (async () => {
          try {
            switch (view) {
              case "overview": return await OperationsOverview();
              case "requests": return await OrganisationRequests({query,staff});
              case "organisations": return await Organisations({query,staff,networkAccess:network});
              case "activity": return await OperationsActivity({query});
              case "activation": return <FederationActivationWorkspace />;
              case "affiliations": return <ControlWorkspace />;
              case "members": return await federationMemberWorkspaceReady().catch(() => false)
                ? <FederationMembers scopes={scopes} /> : <FederationRosterPanel scopes={scopes} />;
            }
          } catch {
            return <WorkspaceUnavailable>WPU couldn’t load this view. Refresh the page to try again.</WorkspaceUnavailable>;
          }
        })()}
      </>}
    </div>
  </main>;
}
