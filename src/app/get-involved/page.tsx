import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { federationDirectory, organisationJoin, playerRegistration, playerSignIn } from "@/lib/public-paths";

export const metadata: Metadata = { title: "Join WPU", alternates: { canonical: "/get-involved" },
  description: "Create a WPU Player Passport or introduce your pickleball federation, association or club." };

export default function GetInvolved() {
  return <main>
    <SiteHeader />
    <section className="public-onboarding">
      <p className="public-eyebrow">World Pickleball Union</p>
      <h1>Join WPU</h1>
      <p className="public-intro">Join as a player or bring your pickleball organisation into the conversation.</p>
      <div className="public-path-grid">
        <article>
          <p className="public-eyebrow">For individuals</p><h2>Get your Player Passport</h2>
          <p>Create a free account and get a permanent WPU Player ID. Use the same Passport to request federation affiliation where available.</p>
          <Link className="public-primary" href={playerRegistration}>Create a Player Passport</Link>
          <p className="public-path-link">Already have a Passport? <Link href={playerSignIn}>Sign in</Link></p>
          <p className="public-path-link"><Link href={federationDirectory}>Find your federation</Link> to request an affiliation.</p>
        </article>
        <article>
          <p className="public-eyebrow">For organisations</p><h2>Join as an organisation</h2>
          <p>Introduce your federation, association or club. WPU reviews requests to participate in the organisational pilot.</p>
          <Link className="public-primary" href={organisationJoin}>Federations, associations &amp; clubs</Link>
          <p className="public-path-link">Formal national membership is a separate process.</p>
        </article>
      </div>
      <p className="public-other-path">Want to support the mission without applying to join? <Link href="/supporters">Pledge support</Link></p>
    </section>
    <SiteFooter />
  </main>;
}
