import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "Governance",
  description:
    "The developing governance framework of the World Pickleball Union, including representation, leadership, accountability and institutional transparency.",
};

const principles = [
  ["01", "◉", "Representation", "International governance should give participating national organisations a meaningful voice."],
  ["02", "◇", "Accountability", "Authority should come with defined responsibilities, oversight and transparent decision-making."],
  ["03", "⚖", "Independence", "Decisions should be made in the interests of the sport rather than individual commercial interests."],
  ["04", "▤", "Transparency", "Governance structures, policies and key decisions should be clearly communicated."],
];

const documents = [
  "Constitution / Statutes",
  "Membership Framework",
  "Governance Regulations",
  "Conflict of Interest Policy",
  "Code of Ethics",
  "Competition & Technical Regulations",
];

export default function GovernancePage() {
  return (
    <main className="governance-page">
      <SiteHeader />

      <section className="gov2-hero">
        <div className="gov2-hero-copy">
          <p className="gov2-kicker"><b>01</b> GOVERNANCE</p>
          <h1>Clear structure.<br />Accountable<br />leadership.</h1>
          <i />
          <strong>Good governance gives international sport credibility.</strong>
          <p>WPU&apos;s governance framework is designed to provide clear responsibilities, meaningful representation and accountable decision-making as the organisation grows.</p>
        </div>
        <div className="gov2-photo gov2-hero-photo">
          <Image
            src="/images/wpu-governance-hero.png"
            alt="International sports representatives in discussion"
            fill
            sizes="(max-width: 1050px) 100vw, 51vw"
            className="gov2-photo-image"
            priority
          />
          <div className="gov2-photo-overlay" aria-hidden="true" />
        </div>
      </section>

      <section className="gov2-section gov2-principles">
        <div className="section-shell">
          <p className="gov2-kicker"><b>02</b> GOVERNANCE PRINCIPLES</p>
          <div className="gov2-heading-row">
            <h2>Authority should always<br />come with responsibility.</h2>
            <p>WPU&apos;s governance framework is built around four fundamental principles.</p>
          </div>
          <div className="gov2-principle-grid">
            {principles.map(([n, icon, title, text]) => (
              <article key={n}>
                <span className="gov2-icon">{icon}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="gov2-section gov2-structure">
        <div className="section-shell">
          <p className="gov2-kicker light"><b>03</b> PROPOSED STRUCTURE</p>
          <div className="gov2-structure-grid">
            <div>
              <h2>Representation.<br />Leadership.<br /><em>Delivery.</em></h2>
              <p>WPU&apos;s proposed governance model separates member representation, strategic oversight and operational delivery.</p>
            </div>
            <div className="gov2-org">
              <div className="gov2-org-card"><b>MEMBER NATIONS</b><small>National pickleball organisations</small></div>
              <span>↓</span>
              <div className="gov2-org-card active"><b>GENERAL ASSEMBLY</b><small>Member representation</small></div>
              <span>↓</span>
              <div className="gov2-org-card"><b>BOARD / EXECUTIVE</b><small>Strategic leadership &amp; oversight</small></div>
              <span>↓</span>
              <div className="gov2-specialists">
                <small>POTENTIAL SPECIALIST BODIES</small>
                <div>
                  <b>Competition</b><b>Standards</b><b>Development</b>
                </div>
              </div>
              <span>↓</span>
              <div className="gov2-org-card"><b>ADMINISTRATION</b><small>Operational delivery</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className="gov2-section gov2-accountability">
        <div className="section-shell">
          <p className="gov2-kicker"><b>04</b> DECISION &amp; ACCOUNTABILITY</p>
          <div className="gov2-account-grid">
            <div>
              <h2>Representation<br />works both ways.</h2>
              <p>WPU is designed so that input from member nations informs decisions, and decisions translate into action, with accountability back to members.</p>
            </div>
            <div className="gov2-cycle">
              <div className="cycle-card c1"><b>1</b><strong>NATIONAL<br />ORGANISATIONS</strong><small>Share needs and perspectives</small></div>
              <div className="cycle-card c2"><b>2</b><strong>GENERAL ASSEMBLY</strong><small>Collective authority</small></div>
              <div className="cycle-card c3"><b>3</b><strong>BOARD / EXECUTIVE</strong><small>Direction and oversight</small></div>
              <div className="cycle-card c4"><b>4</b><strong>IMPLEMENTATION</strong><small>Programmes and services</small></div>
              <div className="cycle-card c5"><b>5</b><strong>REPORTING BACK</strong><small>Progress and accountability</small></div>
              <div className="cycle-core">WPU</div>
              <svg viewBox="0 0 500 390" aria-hidden="true">
                <path d="M250 40 C410 40 460 170 420 270 C375 375 210 390 105 305 C5 225 50 75 185 47" />
              </svg>
            </div>
            <div className="gov2-cycle-callout">A continuous<br />cycle for a<br /><strong>stronger sport.</strong></div>

            <div className="gov2-cycle-mobile" aria-label="WPU decision and accountability cycle">
              <div className="gov2-mobile-step">
                <b>01</b>
                <div>
                  <strong>NATIONAL ORGANISATIONS</strong>
                  <small>Share needs and perspectives</small>
                </div>
              </div>

              <span className="gov2-mobile-arrow">↓</span>

              <div className="gov2-mobile-step">
                <b>02</b>
                <div>
                  <strong>GENERAL ASSEMBLY</strong>
                  <small>Collective authority</small>
                </div>
              </div>

              <span className="gov2-mobile-arrow">↓</span>

              <div className="gov2-mobile-step">
                <b>03</b>
                <div>
                  <strong>BOARD / EXECUTIVE</strong>
                  <small>Direction and oversight</small>
                </div>
              </div>

              <span className="gov2-mobile-arrow">↓</span>

              <div className="gov2-mobile-step">
                <b>04</b>
                <div>
                  <strong>IMPLEMENTATION</strong>
                  <small>Programmes and services</small>
                </div>
              </div>

              <span className="gov2-mobile-arrow">↓</span>

              <div className="gov2-mobile-step">
                <b>05</b>
                <div>
                  <strong>REPORTING BACK</strong>
                  <small>Progress and accountability</small>
                </div>
              </div>

              <div className="gov2-mobile-return">
                <span>↺</span>
                <p>ACCOUNTABILITY BACK TO MEMBERS</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="gov2-integrity">
        <div className="gov2-photo gov2-integrity-photo">
          <Image
            src="/images/wpu-governance-integrity-v2.png"
            alt="Pickleball players demonstrating sportsmanship at the net"
            fill
            sizes="(max-width: 1050px) 100vw, 52vw"
            className="gov2-photo-image"
          />
          <div className="gov2-photo-overlay gov2-photo-overlay-integrity" aria-hidden="true" />
        </div>
        <div className="gov2-integrity-copy">
          <p className="gov2-kicker light"><b>05</b> INTEGRITY</p>
          <h2>Decisions for<br /><em>the sport.</em></h2>
          <strong>Credible governance requires more than organisational charts.</strong>
          <p>WPU will establish policies addressing conflicts of interest, ethical conduct, decision-making responsibilities and appropriate institutional oversight.</p>
        </div>
      </section>

      <section className="gov2-section gov2-documents">
        <div className="section-shell gov2-doc-grid">
          <div>
            <p className="gov2-kicker"><b>06</b> GOVERNANCE DOCUMENTS</p>
            <h2>Governance should<br />be visible.</h2>
            <p>Core WPU governance documents will be published here as they are formally developed and adopted.</p>
          </div>
          <div className="gov2-doc-list">
            {documents.map((title, i) => (
              <div key={title}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <strong>{title}</strong>
                <small>IN DEVELOPMENT</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="gov2-status">
        <div className="section-shell">
          <p className="gov2-kicker light"><b>07</b> CURRENT STATUS</p>
          <div className="gov2-status-grid">
            <h2>Establishing the<br />foundation<br /><em>properly.</em></h2>
            <div className="gov2-timeline">
              <div className="gov2-timeline-line" />
              {[
                ["FOUNDATION", "CURRENT", "Establishing WPU and developing core governance framework."],
                ["GOVERNANCE", "IN DEVELOPMENT", "Formal structures and documents."],
                ["MEMBERSHIP", "TO FOLLOW", "Onboarding national organisations."],
                ["OPERATION", "TO FOLLOW", "Full implementation as WPU grows."],
              ].map(([title, status, text], i) => (
                <article className={i === 0 ? "current" : ""} key={title}>
                  <b>{title}</b><i /><strong>{status}</strong><p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="section-shell final-inner">
          <p>WORLD PICKLEBALL UNION</p>
          <h2>Clear governance.<br />Stronger sport.</h2>
          <div className="about-final-action">
            <Link href="/#members">BUILD WITH WPU →</Link>
            <p>NATIONAL ORGANISATIONS · PARTNERS · CONTRIBUTORS</p>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <Link href="/"><Image src="/brand/wpu-logo-approved.png" alt="World Pickleball Union" width={245} height={70} /></Link>
          <div className="footer-copy"><p>UNITING PICKLEBALL WORLDWIDE.</p><small>World Pickleball Union</small></div>
        </div>
      </footer>
    </main>
  );
}
