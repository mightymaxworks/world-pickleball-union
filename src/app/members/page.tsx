import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import OrganisationIntakeForm from "./organisation-intake";

export const metadata: Metadata = { title: "Federations, Associations & Clubs", alternates: { canonical: "/members" },
  description: "Introduce your federation, association or club and request to participate in the WPU organisation pilot." };

const membershipBenefits = [
  {
    number: "01",
    title: "Representation",
    text: "Participate in the developing international governance framework of WPU.",
  },
  {
    number: "02",
    title: "Competition",
    text: "Connect national pathways with WPU international competition structures as they are established.",
  },
  {
    number: "03",
    title: "Standards",
    text: "Participate in the development and adoption of clear international standards for the sport.",
  },
  {
    number: "04",
    title: "Development",
    text: "Share knowledge, programmes and resources that support sustainable pickleball development.",
  },
];

const responsibilities = [
  "Represent the sport responsibly within their jurisdiction.",
  "Support fair play, integrity and athlete welfare.",
  "Maintain appropriate organisational governance.",
  "Communicate openly with WPU and other participating organisations.",
  "Support agreed international rules, standards and policies as they are formally adopted.",
];

export default function OrganisationsPage() {
  return (
    <main className="members-page">
      <SiteHeader />

      <section className="mem-hero">
        <div className="mem-hero-copy">
          <p className="mem-kicker">
            <b>01</b> FEDERATIONS, ASSOCIATIONS &amp; CLUBS
          </p>

          <h1>
            A global union
            <br />
            starts with
            <br />
            <em>national representation.</em>
          </h1>

          <div className="mem-hero-rule" />

          <strong>
            WPU is being built around the organisations developing pickleball
            within their own countries and territories.
          </strong>

          <p>
            The World Pickleball Union is developing an international
            membership framework designed to give national organisations a
            meaningful place in the future governance and development of the
            sport.
          </p>

          <a href="#register" className="mem-primary-action">
            INTRODUCE YOUR ORGANISATION →
          </a>
        </div>

        <div className="mem-hero-photo">
          <Image
            src="/images/wpu-members-global-community.png"
            alt="Pickleball players coming together as an international community"
            fill
            priority
            sizes="50vw"
          />
          <div className="mem-photo-overlay" />
          <div className="mem-photo-caption">
            <span>MEMBERSHIP</span>
            <strong>MANY NATIONS.<br />ONE GLOBAL SPORT.</strong>
          </div>
        </div>
      </section>

      <nav className="section-shell mem-contents" aria-label="On this page">
        <Link href="#register">Introduce your organisation</Link>
        <Link href="#national-membership">National membership</Link>
        <Link href="#representation">Representation</Link>
        <Link href="#admission-pathway">Admission pathway</Link>
        <Link href="#member-responsibilities">Member responsibilities</Link>
        <Link href="#membership-framework">Framework and documents</Link>
      </nav>

      <section className="public-onboarding mem-intake-block" aria-label="Organisation participation">
        <div className="public-path-grid">
          <article><h2>National federations and associations</h2><p>Start a conversation about using WPU tools and connecting your national pickleball community. Formal membership and representation are separate from pilot participation.</p></article>
          <article><h2>Regional associations and clubs</h2><p>Tell us where you operate and what you’re building. You can request to participate without changing your local governance or national representation.</p></article>
        </div>
        <section id="register" className="public-intake-card mem-intake-form" aria-labelledby="org-intake-title">
          <p className="public-eyebrow">Request to participate</p>
          <h2 id="org-intake-title">Introduce your organisation</h2>
          <p>You’ll get a reference after submitting. A WPU reviewer will review the request and may contact you about the next step. This is not a formal membership application, recognition or approval to access member data.</p>
          <OrganisationIntakeForm />
        </section>
      </section>

      <section className="mem-section mem-who" id="national-membership">
        <div className="section-shell">
          <p className="mem-kicker">
            <b>02</b> WHO WPU IS FOR
          </p>

          <div className="mem-two-column">
            <h2>
              Built around
              <br />
              national
              <br />
              <em>organisations.</em>
            </h2>

            <div className="mem-copy">
              <strong>
                International sport works best when national voices have a
                meaningful route to participate.
              </strong>

              <p>
                WPU membership is being developed primarily for organisations
                that represent, organise or are responsible for the development
                of pickleball at a national or territorial level.
              </p>

              <p>
                The formal eligibility, recognition and admission requirements
                will be defined through WPU&apos;s Membership Framework and
                governance documents as they are established.
              </p>

              <div className="mem-status">
                <span>STATUS</span>
                <b>MEMBERSHIP FRAMEWORK IN DEVELOPMENT</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mem-section mem-voice" id="representation">
        <div className="section-shell">
          <p className="mem-kicker light">
            <b>03</b> REPRESENTATION
          </p>

          <div className="mem-voice-grid">
            <div>
              <h2>
                One nation.
                <br />
                <em>One voice.</em>
              </h2>

              <p>
                The developing WPU model is intended to place national
                representation at the centre of international decision-making.
              </p>
            </div>

            <div className="mem-representation-visual">
              <div className="mem-country-node">NATIONAL ORGANISATION</div>
              <span>↓</span>
              <div className="mem-country-node active">
                WPU
                <small>INTERNATIONAL REPRESENTATION</small>
              </div>
              <span>↓</span>
              <div className="mem-country-node">GLOBAL DEVELOPMENT</div>
            </div>
          </div>

          <div className="mem-representation-photo">
            <Image
              src="/images/wpu-members-representation.png"
              alt="Pickleball representatives discussing international cooperation"
              fill
              sizes="(max-width: 1050px) 100vw, 1180px"
            />
            <div className="mem-photo-label">
              <span>REPRESENTATION</span>
              <strong>National voices. International cooperation.</strong>
            </div>
          </div>

          <p className="mem-note">
            The final representation and voting structure will be determined by
            WPU&apos;s formally adopted governance framework.
          </p>
        </div>
      </section>

      <section className="mem-section mem-pathway-section" id="admission-pathway">
        <div className="section-shell">
          <p className="mem-kicker">
            <b>04</b> MEMBERSHIP PATHWAY
          </p>

          <div className="mem-heading-row">
            <h2>
              A clear route
              <br />
              <em>into the union.</em>
            </h2>

            <p>
              The formal admission process is still being developed. Pilot participation is not formal admission. The
              intended pathway is designed to remain straightforward and
              transparent.
            </p>
          </div>

          <div className="mem-pathway">
            {[
              ["01", "INTEREST", "Tell WPU about your organisation."],
              ["02", "REVIEW", "Initial discussion and organisational review."],
              ["03", "APPLICATION", "Formal process once the framework is adopted."],
              ["04", "ADMISSION", "Admission under WPU governance requirements."],
              ["05", "PARTICIPATION", "Representation and involvement in WPU."],
            ].map(([number, title, text]) => (
              <article key={number}>
                <b>{number}</b>
                <strong>{title}</strong>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mem-section mem-benefits">
        <div className="section-shell">
          <p className="mem-kicker light">
            <b>05</b> WHAT MEMBERSHIP ENABLES
          </p>

          <div className="mem-heading-row">
            <h2>
              Participate.
              <br />
              Contribute.
              <br />
              <em>Build together.</em>
            </h2>

            <p>
              Membership is intended to connect national development with the
              wider international structure of the sport.
            </p>
          </div>

          <div className="mem-benefit-grid">
            {membershipBenefits.map((item) => (
              <article key={item.number}>
                <b>{item.number}</b>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mem-section mem-responsibilities" id="member-responsibilities">
        <div className="section-shell mem-responsibility-grid">
          <div>
            <p className="mem-kicker">
              <b>06</b> MEMBER RESPONSIBILITIES
            </p>

            <h2>
              Membership means
              <br />
              <em>responsibility.</em>
            </h2>

            <p>
              A strong international federation depends on strong national
              organisations.
            </p>
          </div>

          <div className="mem-responsibility-list">
            {responsibilities.map((item, index) => (
              <div key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mem-development-photo">
        <Image
          src="/images/wpu-members-development.png"
          alt="Coach helping develop pickleball players across generations"
          fill
          sizes="100vw"
        />
        <div className="mem-development-shade" />
        <div className="section-shell mem-development-copy">
          <p>WHY MEMBERSHIP MATTERS</p>
          <h2>
            Strong organisations.<br />
            More opportunities<br />
            <em>to play.</em>
          </h2>
          <span>
            International structure should ultimately help more people
            discover, learn and develop through pickleball.
          </span>
        </div>
      </section>

      <section className="mem-section mem-framework" id="membership-framework">
        <div className="section-shell">
          <p className="mem-kicker light">
            <b>07</b> MEMBERSHIP FRAMEWORK
          </p>

          <div className="mem-framework-grid">
            <div>
              <h2>
                Building the
                <br />
                foundation
                <br />
                <em>properly.</em>
              </h2>

              <p>
                Formal membership will operate under WPU&apos;s adopted
                constitutional and governance framework.
              </p>
            </div>

            <div className="mem-framework-docs">
              <div>
                <span>01</span>
                <strong>CONSTITUTION / STATUTES</strong>
                <small>IN DEVELOPMENT</small>
              </div>
              <div>
                <span>02</span>
                <strong>MEMBERSHIP FRAMEWORK</strong>
                <small>IN DEVELOPMENT</small>
              </div>
              <div>
                <span>03</span>
                <strong>ADMISSION CRITERIA</strong>
                <small>IN DEVELOPMENT</small>
              </div>
              <div>
                <span>04</span>
                <strong>MEMBER RIGHTS &amp; RESPONSIBILITIES</strong>
                <small>IN DEVELOPMENT</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell" style={{padding:"65px 0"}}>
        <h2 style={{fontSize:"clamp(30px,4vw,48px)",letterSpacing:"-.04em"}}>Support WPU without applying for membership.</h2>
        <p style={{maxWidth:680,lineHeight:1.8}}>Organisations wishing to pledge support for WPU&apos;s mission can join the Global Support Network. A pledge is separate from membership, representation and admission.</p>
        <Link href="/supporters" className="button-primary">Explore the Global Support Network →</Link>
      </section>
      <section className="final-cta">
        <div className="section-shell final-inner">
          <p>WORLD PICKLEBALL UNION</p>
          <h2>
            Many nations.
            <br />
            One global sport.
          </h2>

          <div className="about-final-action">
            <a href="#register">INTRODUCE YOUR ORGANISATION →</a>
            <p>NATIONAL ORGANISATIONS · REPRESENTATION · DEVELOPMENT</p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
