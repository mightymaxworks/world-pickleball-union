import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import OrganisationIntakeForm from "./organisation-intake";
import { playerRegistration } from "@/lib/public-paths";

export const metadata: Metadata = { title: "Federations, Associations & Clubs", alternates: { canonical: "/members" },
  description: "Introduce your federation, association or club and request to participate in the WPU organisation pilot." };

export default function OrganisationsPage() {
  return <main>
    <SiteHeader />
    <section className="public-onboarding">
      <p className="public-eyebrow">Organisation participation</p>
      <h1>Federations, associations &amp; clubs</h1>
      <p className="public-intro">Introduce your pickleball organisation and tell us how you want to work with WPU.</p>
      <div className="public-path-grid">
        <article><h2>National federations and associations</h2><p>Start a conversation about using WPU tools and connecting your national pickleball community. Formal national membership and representation are separate from pilot participation.</p></article>
        <article><h2>Regional associations and clubs</h2><p>Tell us where you operate and what you’re building. WPU can review your interest in participating as an organisation without changing your local governance or national representation.</p></article>
      </div>
      <section id="register" className="public-intake-card" aria-labelledby="org-intake-title">
        <p className="public-eyebrow">Request to participate</p>
        <h2 id="org-intake-title">Introduce your organisation</h2>
        <p>You’ll get a reference after submitting. A WPU reviewer will review the request and may contact you about the next step. This is not a formal membership application, recognition or approval to access member data.</p>
        <OrganisationIntakeForm />
      </section>
      <details className="public-other-path">
        <summary>How formal national membership is intended to work</summary>
        <p>WPU is developing a national membership framework built around one national voice per country or territory, with common responsibilities for fair governance, sporting integrity and development. Eligibility and formal admission are not yet open under that framework. Taking part in the pilot is not a claim to national representation.</p>
        <p><Link href="/governance">Explore WPU governance</Link></p>
      </details>
      <section className="public-other-path">
        <h2>Other ways to take part</h2>
        <p>Already playing with Bhutan? Use the <Link href="/federations/bhutan">Bhutan Player Passport pilot</Link> to request individual affiliation. New to WPU as a player? <Link href={playerRegistration}>Create your Passport</Link>.</p>
        <p><Link href="/governance">Read about WPU governance</Link> or <Link href="/supporters">pledge support without applying to join</Link>.</p>
      </section>
    </section>
    <SiteFooter />
  </main>;
}
