import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { controlConfig } from "@/lib/control/access";
import { signedInAccount } from "@/lib/control/http";
import { federationPilotEnabled, federationPortal } from "@/lib/federations/service";
import { isFederationSlug } from "@/lib/federations/slug";
import AffiliationRequest from "./request";
import "../../control/control.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Federation Passport entry", robots: { index: false, follow: false } };

export default async function FederationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isFederationSlug(slug) || !federationPilotEnabled() || !controlConfig()) notFound();
  const account = await signedInAccount();
  const federation = await federationPortal(slug, account);
  if (!federation) notFound();
  const join = "/join?federation=" + slug;
  return <main className="wc">
    <header className="wc-header"><Image src="/brand/wpu-logo-approved.png" alt="World Pickleball Union" width={150} height={50} unoptimized /><Link href="/passport">Player Passport</Link></header>
    <div className="wc-content">
      <p className="wc-label">Federation Passport entry</p>
      <h1>{federation.name}</h1>
      <p>Use your existing WPU Player Passport or create one to request an affiliation.</p>
      <section className="wc-box">
        {!account ? <>
          <h2>One Passport, one Player ID</h2>
          <p>Already registered? Sign in with the email you used for your Passport.</p>
          <div className="wc-actions"><Link className="wc-link-button" href={join + "&mode=login"}>Sign in to WPU</Link><Link className="wc-link-button" href={join}>Create a Passport</Link></div>
        </> : <>
          <h2>Your affiliation</h2>
          {federation.state === "approved" ? <p>WPU approved your affiliation. See the current record in your Passport.</p>
            : federation.state === "awaiting_review" ? <p>Your request is awaiting WPU review.</p>
            : federation.state === "awaiting_player" ? <p>You have an invitation to respond to in your Passport.</p>
            : federation.accepting && federation.eligible ? <AffiliationRequest organisationId={federation.id} />
            : <p>Affiliation requests are not available for this Passport here.</p>}
          <Link className="wc-text-link" href="/passport">Open your Passport</Link>
        </>}
        <p className="wc-portal-note">Affiliation does not establish national representation or competition eligibility.</p>
      </section>
    </div>
  </main>;
}
