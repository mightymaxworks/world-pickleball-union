import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import "./marina.css";

export const metadata: Metadata = {
  title: "Global Marina Initiative",
  description: "Explore WPU's proposed Global Marina Initiative: 1–4 pickleball courts, inclusive family programmes, coach development and opportunities across pickleball and sailing.",
  alternates: { canonical: "/initiatives/global-marina" },
  openGraph: { title: "Global Marina Initiative | WPU", description: "Play. Sail. Coach. Grow. Together. An inclusive marina and youth development initiative.", url: "/initiatives/global-marina" },
};

const steps = [
  ["01", "Establish marina hubs", "Explore 1–4 flexible pickleball courts at suitable marinas and waterfront clubs, without disrupting essential marine operations."],
  ["02", "Train and empower coaches", "Help sailing coaches pursue pickleball qualifications, and invite qualified pickleball coaches into marina programmes. Sport-specific qualifications remain separate."],
  ["03", "Activate inclusive communities", "Welcome children, parents, grandparents, non-sailors, schools and people with disabilities through accessible activities and family programmes."],
  ["04", "Develop talent and careers", "Create opportunities for athletes, coaches, officials, volunteers and organisers. Encourage sailors to try pickleball and pickleball players to discover sailing."],
  ["05", "Connect and grow globally", "Explore cross-club exchanges, youth camps, coach exchanges and community events through a growing international network."],
];
const pathways = [
  ["Athletes", "Discover • Play • Cross-train • Develop", "Choose pickleball, sailing or both; progress at your own pace."],
  ["Coaches", "Learn • Qualify • Coach • Lead", "New opportunities for sailing coaches and qualified pickleball professionals."],
  ["People", "Participate • Volunteer • Organise • Connect", "Meaningful roles for families and communities beyond competition."],
];

export default function MarinaPage() {
  return <main className="marina-page">
    <SiteHeader />
    <section className="marina-hero">
      <div className="marina-wrap marina-hero-grid">
        <div>
          <p className="marina-kicker">WPU / GLOBAL INITIATIVES</p>
          <h1>Play. Sail.<br/><em>Grow. Together.</em></h1>
          <p className="marina-lead">The WPU Global Marina Initiative is a proposed international programme to bring inclusive pickleball, family activities, coach development and dual-sport opportunities to marina communities.</p>
          <div className="marina-actions"><a href="#model" className="marina-primary">Explore the five steps →</a><a href="#partner" className="marina-outline">Explore partnership →</a></div>
          <p className="marina-status">Programme in development · Expressions of interest welcomed</p>
        </div>
        <div className="marina-hero-photo"><Image src="/images/wpu-development-youth.png" alt="Young pickleball participants learning together" fill priority sizes="(max-width: 900px) 100vw, 48vw" /></div>
      </div>
    </section>
    <section className="marina-intro marina-wrap">
      <p className="marina-kicker">MORE THAN COURTS</p>
      <h2>One marina. <em>More ways to belong.</em></h2>
      <p>Pickleball can complement sailing at suitable waterfront venues, giving families more ways to spend time together and introducing new participants to both sports. The proposed modular model allows one to four courts according to available space, community demand and safety requirements.</p>
      <div className="marina-stats"><div><strong>1–4</strong><span>Potential courts per marina</span></div><div><strong>2</strong><span>Complementary sports</span></div><div><strong>3</strong><span>People-development pathways</span></div></div>
    </section>
    <section className="marina-model" id="model"><div className="marina-wrap">
      <p className="marina-kicker">THE DEVELOPMENT MODEL</p><h2>Five steps. <em>One connected community.</em></h2>
      <div className="marina-step-grid">{steps.map(([n,title,description])=><article className="marina-step" key={n}><span>{n}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
    </div></section>
    <section className="marina-wrap marina-pathways" id="pathways">
      <p className="marina-kicker">INTEGRATED DEVELOPMENT</p><h2>Different journeys. <em>Shared opportunities.</em></h2>
      <p>Cross-pollination works both ways: sailing athletes can discover pickleball and pickleball athletes can explore sailing. Dual-sport participation is an opportunity, not a requirement. Qualified instructors and appropriate water-safety procedures are essential for sailing activities.</p>
      <div className="marina-path-grid">{pathways.map(([title,track,desc])=><article key={title}><h3>{title}</h3><strong>{track}</strong><p>{desc}</p></article>)}</div>
    </section>
    <section className="marina-partner" id="partner"><div className="marina-wrap marina-partner-inner">
      <div><p className="marina-kicker">PARTNER WITH WPU</p><h2>Help build the next generation of marina communities.</h2><p>We welcome exploratory conversations with marina operators, sailing clubs, national organisations, schools, coaches and community partners.</p><p>Potential partnerships and programme standards remain subject to agreement and implementation planning.</p></div>
      <div className="marina-partner-card"><h3>Interested in participating?</h3><p>Tell WPU about your organisation, location, facilities and development interests.</p><a href="mailto:info@worldpickleball.world?subject=WPU%20Global%20Marina%20Initiative%20-%20Expression%20of%20Interest" className="marina-primary">Express interest →</a><small>WPU will review enquiries before confirming any programme partnership.</small></div>
    </div></section>
    <SiteFooter />
  </main>;
}
