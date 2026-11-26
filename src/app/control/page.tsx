import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { accessEmail, controlConfig } from "@/lib/control/access";
import { signedInAccount } from "@/lib/control/http";
import { federationAdminScopes, federationPilotEnabled } from "@/lib/federations/service";
import FederationRosterPanel from "./federation-roster";
import ControlWorkspace from "./workspace";
import "./control.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "WPU Control", robots: { index: false, follow: false } };

export default async function ControlPage() {
  const config = controlConfig();
  if (!config) notFound();
  const assertion = (await headers()).get("cf-access-jwt-assertion");
  const email = accessEmail(assertion, config, "page");
  const scopes = email && federationPilotEnabled() ? await signedInAccount().then(account =>
    account ? federationAdminScopes({ account, email }) : []).catch(() => []) : [];
  return <main className="wc">
    <header className="wc-header"><Image src="/brand/wpu-logo-approved.png" alt="World Pickleball Union" width={150} height={50} unoptimized /><Link href="/passport">Player Passport</Link></header>
    <div className="wc-content">
      <p className="wc-label">Operations pilot</p><h1>WPU Control</h1>
      <p>Propose, review and correct player affiliations within your assigned organisations.</p>
      {email ? <>{scopes.length > 0 && <FederationRosterPanel scopes={scopes} />}<ControlWorkspace /></> : <section className="wc-box">
        <h2>Staff verification required</h2>
        <p>Open this workspace through the WPU staff access portal. A WPU member sign-in on its own does not grant staff access.</p>
      </section>}
    </div>
  </main>;
}
