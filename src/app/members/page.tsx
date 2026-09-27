import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "Membership",
  description:
    "Learn about the developing World Pickleball Union membership framework and how national pickleball organisations can express interest in participating.",

  alternates: {
    canonical: "/members",
  },

  openGraph: {
    type: "website",
    url: "/members",
    siteName: "World Pickleball Union",
    title: "Membership | World Pickleball Union",
    description:
      "Learn about the developing World Pickleball Union membership framework and how national pickleball organisations can express interest in participating.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "World Pickleball Union — Uniting Pickleball Worldwide",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Membership | World Pickleball Union",
    description:
      "Learn about the developing World Pickleball Union membership framework and how national pickleball organisations can express interest in participating.",
    images: ["/opengraph-image.png"],
  },
};

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

export default function MembersPage() {
  return (
    <main className="members-page">
      <SiteHeader />

      <section className="mem-hero">
        <div className="mem-hero-copy">
          <p className="mem-kicker">
            <b>01</b> MEMBERSHIP
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
            REGISTER INTEREST →
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

      <section className="mem-section mem-who">
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

      <section className="mem-section mem-voice">
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

      <section className="mem-section mem-pathway-section">
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
              The formal admission process is still being developed. The
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

      <section className="mem-section mem-responsibilities">
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

      <section className="mem-section mem-framework">
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

      <section className="mem-register" id="register">
        <div className="section-shell mem-register-grid">
          <div className="mem-register-copy">
            <p className="mem-kicker">
              <b>08</b> REGISTER INTEREST
            </p>

            <h2>
              Bring your
              <br />
              nation into the
              <br />
              <em>conversation.</em>
            </h2>

            <strong>
              Represent or help lead a national pickleball organisation?
            </strong>

            <p>
              Leave your details and introduce your organisation to WPU. This
              is a registration of interest and does not constitute a formal
              application for, or admission to, WPU membership.
            </p>
          </div>

          <form className="mem-form">
            <div className="mem-form-row">
              <label>
                ORGANISATION / FEDERATION NAME *
                <input
                  type="text"
                  name="organisation"
                  placeholder="Organisation name"
                  required
                />
              </label>

              <label>
                COUNTRY / TERRITORY *
                <input
                  type="text"
                  name="country"
                  placeholder="Country or territory"
                  required
                />
              </label>
            </div>

            <div className="mem-form-row">
              <label>
                CONTACT PERSON *
                <input
                  type="text"
                  name="contactName"
                  placeholder="Full name"
                  required
                />
              </label>

              <label>
                ROLE / POSITION *
                <input
                  type="text"
                  name="role"
                  placeholder="Your role"
                  required
                />
              </label>
            </div>

            <div className="mem-form-row">
              <label>
                EMAIL *
                <input
                  type="email"
                  name="email"
                  placeholder="name@organisation.org"
                  required
                />
              </label>

              <label>
                PHONE / WHATSAPP
                <input
                  type="tel"
                  name="phone"
                  placeholder="+65"
                />
              </label>
            </div>

            <label>
              WEBSITE / SOCIAL PAGE
              <input
                type="url"
                name="website"
                placeholder="https://"
              />
            </label>

            <label>
              TELL US ABOUT PICKLEBALL IN YOUR COUNTRY
              <textarea
                name="message"
                rows={5}
                placeholder="A short introduction to your organisation and pickleball community..."
              />
            </label>

            <label className="mem-consent">
              <input type="checkbox" required />
              <span>
                I agree that WPU may use these details to contact me regarding
                membership and organisational development.
              </span>
            </label>

            <button type="submit">SUBMIT INTEREST →</button>

            <small className="mem-form-disclaimer">
              Registration of interest does not constitute WPU membership or
              guarantee future admission.
            </small>
          </form>
        </div>
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
            <a href="#register">REGISTER INTEREST →</a>
            <p>NATIONAL ORGANISATIONS · REPRESENTATION · DEVELOPMENT</p>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <Link href="/">
            <Image
              src="/brand/wpu-logo-approved.png"
              alt="World Pickleball Union"
              width={245}
              height={70}
            />
          </Link>

          <div className="footer-copy">
            <p>UNITING PICKLEBALL WORLDWIDE.</p>
            <small>World Pickleball Union</small>
          </div>
        </div>
      </footer>
    </main>
  );
}
