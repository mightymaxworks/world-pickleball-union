import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { controlConfig } from "@/lib/control/access";
import { federationPilotEnabled, playerFederations } from "@/lib/federations/service";
import { regionLabel } from "@/lib/passport/regions";
import { federationDirectory, organisationJoin } from "@/lib/public-paths";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Find your federation", alternates: { canonical: federationDirectory },
  description: "Find federations accepting affiliation requests through the WPU Player Passport." };

const normalize = (name: string) => name.normalize("NFKC").toLocaleLowerCase("en");

export default async function FederationDirectory({ searchParams }: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const search = typeof q === "string" ? q.trim().slice(0, 100) : "";
  const term = normalize(search);
  const available = federationPilotEnabled() && controlConfig()
    ? await playerFederations().catch(() => null) : [];
  const results = available?.map(item => ({ ...item, country: regionLabel(item.countryCode) }))
    .filter(item => !term || [item.name, item.country, item.countryCode ?? ""].some(value => normalize(value).includes(term)));
  return <main>
    <SiteHeader />
    <section className="public-onboarding">
      <p className="public-eyebrow">WPU Player Passport</p>
      <h1>Find your federation</h1>
      <p className="public-intro">If you already belong to a federation listed here, request an affiliation using your WPU Player Passport. You keep the same Player ID.</p>
      <p>WPU reviews requests before adding an affiliation to your Passport. Affiliation does not establish national representation or competition eligibility.</p>
      {available && available.length > 0 && <form className="public-intake-form public-directory-search" action={federationDirectory}>
        <label>Federation name or country<input name="q" type="search" maxLength={100} defaultValue={search} /></label>
        <div><button className="public-primary" type="submit">Search</button>
          {search && <Link href={federationDirectory}>Clear search</Link>}
        </div>
      </form>}
      {available === null
        ? <p role="status">The federation directory is temporarily unavailable. Please try again shortly.</p>
        : available.length === 0
          ? <p>No federations are accepting online requests here right now. You can still view your existing affiliations in your Passport.</p>
          : results?.length === 0
            ? <p>No available federation matches your search.</p>
            : <div className="public-path-grid">
              {results?.map(item => <article key={item.slug}>
                {item.country && <p className="public-eyebrow">{item.country}</p>}
                <h2>{item.name}</h2>
                <Link className="public-primary" href={federationDirectory + "/" + item.slug}
                  aria-label={"Open affiliation for " + item.name}>View affiliation</Link>
              </article>)}
            </div>}
      <div className="public-other-path">
        <p><Link href="/passport">Go to your Player Passport</Link> to check your affiliations or requests.</p>
        <p>Here on behalf of an organisation? <Link href={organisationJoin}>Visit Federations, Associations &amp; Clubs</Link>.</p>
      </div>
    </section>
    <SiteFooter />
  </main>;
}
