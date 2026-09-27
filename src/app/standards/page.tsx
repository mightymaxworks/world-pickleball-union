import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "Standards",
  description:
    "Explore WPU's developing international pickleball standards for equipment, coaching, officiating, courts, competition, integrity and certification.",

  alternates: {
    canonical: "/standards",
  },

  openGraph: {
    type: "website",
    url: "/standards",
    siteName: "World Pickleball Union",
    title: "Standards | World Pickleball Union",
    description:
      "Explore WPU's developing international pickleball standards for equipment, coaching, officiating, courts, competition, integrity and certification.",
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
    title: "Standards | World Pickleball Union",
    description:
      "Explore WPU's developing international pickleball standards for equipment, coaching, officiating, courts, competition, integrity and certification.",
    images: ["/opengraph-image.png"],
  },
};

const framework = [
  ["01", "PLAYER", "The reason standards exist."],
  ["02", "COACH", "Develop people consistently."],
  ["03", "EQUIPMENT", "Know what is approved."],
  ["04", "COURT", "Create reliable environments."],
  ["05", "OFFICIAL", "Apply the game consistently."],
  ["06", "COMPETITION", "Connect everything together."],
];

const library = [
  ["01", "EQUIPMENT STANDARDS", "IN DEVELOPMENT"],
  ["02", "COACHING FRAMEWORK", "IN DEVELOPMENT"],
  ["03", "OFFICIATING FRAMEWORK", "IN DEVELOPMENT"],
  ["04", "RULES OF PLAY", "IN DEVELOPMENT"],
  ["05", "COMPETITION REGULATIONS", "IN DEVELOPMENT"],
  ["06", "COURT & FACILITY STANDARDS", "IN DEVELOPMENT"],
];

export default function StandardsPage() {
  return (
    <main className="standards-page">
      <SiteHeader />

      {/* 01 — HERO */}
      <section className="std-hero">
        <div className="std-hero-grid" />

        <div className="section-shell std-hero-inner">
          <p className="std-kicker">
            <b>01</b> STANDARDS
          </p>

          <h1>
            High standards.
            <br />
            <em>Low barriers.</em>
          </h1>

          <div className="std-hero-bottom">
            <p>
              WPU is developing clear, practical international standards designed
              to create trust and consistency without unnecessary complexity.
            </p>

            <div className="std-hero-action-group">
            <a href="#framework">EXPLORE THE FRAMEWORK ↓</a>
            <div className="std-measure-line">
              <span>MEASURE</span>
              <i />
              <span>VERIFY</span>
              <i />
              <span>TRUST</span>
            </div>
          </div>
          </div>
        </div>

        <div className="std-hero-axis">
          <span>ACCESSIBLE</span>
          <i />
          <span>TRUSTED</span>
        </div>
      </section>

      {/* 02 — PHILOSOPHY */}
      <section className="std-section std-philosophy">
        <div className="section-shell std-two-column">
          <div>
            <p className="std-kicker">
              <b>02</b> WHY STANDARDS MATTER
            </p>

            <h2>
              Consistency
              <br />
              creates <em>trust.</em>
            </h2>
          </div>

          <div className="std-copy">
            <strong>
              Standards should make international pickleball easier to
              understand, organise and participate in — not harder.
            </strong>

            <p>
              Pickleball will continue to develop differently across countries,
              communities and organisations. WPU does not need every part of the
              world to look identical.
            </p>

            <p>
              What the sport does need is a common foundation: enough consistency
              for players, coaches, officials, organisers and manufacturers to
              understand what is expected when they participate internationally.
            </p>

            <div className="std-principle">
              <span>THE PRINCIPLE</span>
              <b>TRUST · CONSISTENCY · INTERNATIONAL COMPATIBILITY</b>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — CONNECTED FRAMEWORK */}
      <section className="std-section std-framework" id="framework">
        <div className="section-shell">
          <div className="std-heading-row">
            <div>
              <p className="std-kicker light">
                <b>03</b> ONE CONNECTED FRAMEWORK
              </p>

              <h2>
                Different parts.
                <br />
                <em>One sport.</em>
              </h2>
            </div>

            <p>
              International standards work when the different parts of the game
              connect rather than operate in isolation.
            </p>
          </div>

          <div className="std-framework-flow">
            {framework.map(([number, title, text]) => (
              <article key={title}>
                <span>{number}</span>
                <div className="std-framework-node" />
                <strong>{title}</strong>
                <p>{text}</p>
              </article>
            ))}
          </div>

          <div className="std-world-stage">
            <span>CONNECTED BY COMMON STANDARDS</span>
            <strong>INTERNATIONAL PICKLEBALL</strong>
          </div>
        </div>
      </section>

      {/* 04 — EQUIPMENT */}
      <section className="std-section std-equipment">
        <div className="section-shell">
          <div className="std-cert-head">
            <div>
              <p className="std-kicker">
                <b>04</b> EQUIPMENT CERTIFICATION
              </p>

              <h2>
                Certify the
                <br />
                <em>equipment.</em>
              </h2>
            </div>

            <div>
              <strong>
                Equipment certification should protect the game — not create
                unnecessary barriers to entering it.
              </strong>

              <p>
                WPU is developing an affordable and accessible equipment
                certification framework for manufacturers of all sizes, based on
                clear technical requirements and supported by recognised
                international engineering and technical institutions.
              </p>
            </div>
          </div>

          <div className="std-equipment-process">
            <article>
              <span>01</span>
              <strong>SUBMIT</strong>
              <p>Simple entry into the certification process.</p>
            </article>

            <i>→</i>

            <article>
              <span>02</span>
              <strong>TEST</strong>
              <p>Assessment against published technical requirements.</p>
            </article>

            <i>→</i>

            <article>
              <span>03</span>
              <strong>CERTIFY</strong>
              <p>Approved equipment enters the certification system.</p>
            </article>

            <i>→</i>

            <article className="active">
              <span>04</span>
              <strong>VERIFY</strong>
              <p>Certification status can be checked simply.</p>
            </article>

            <i>→</i>

            <article>
              <span>05</span>
              <strong>PLAY</strong>
              <p>Confidence for players, organisers and officials.</p>
            </article>
          </div>

          <div className="std-equipment-feature">
            <div className="std-equipment-photo">
              <img
                className="std-photo-img"
                src="/images/wpu-standards-equipment.png"
                alt="Pickleball paddle undergoing technical testing and digital verification"
              />

              <div className="std-equipment-photo-shade" />

              <div className="std-equipment-stamp">
                <span>WPU CERTIFICATION</span>
                <strong>TESTED</strong>
                <i />
                <strong>VERIFIABLE</strong>
              </div>
            </div>

            <div className="std-equipment-detail">
              <span className="std-detail-label">A PRACTICAL CERTIFICATION SYSTEM</span>

              <h3>
                Rigorous enough
                <br />
                to <em>trust.</em>
              </h3>

              <p>
                WPU is developing equipment certification around clear published
                requirements, independent technical assessment and practical
                access for manufacturers of different sizes.
              </p>

              <div className="std-detail-points">
                <div>
                  <span>01</span>
                  <strong>TECHNICAL TESTING</strong>
                  <p>
                    Assessment supported by recognised international engineering
                    and technical institutions.
                  </p>
                </div>

                <div>
                  <span>02</span>
                  <strong>AFFORDABLE ACCESS</strong>
                  <p>
                    A certification model designed to avoid unnecessary cost and
                    administrative barriers.
                  </p>
                </div>

                <div>
                  <span>03</span>
                  <strong>ONSITE CAPABILITY</strong>
                  <p>
                    Practical onsite testing may be provided where appropriate
                    for manufacturers, events and industry gatherings.
                  </p>
                </div>

                <div>
                  <span>04</span>
                  <strong>DIGITAL VERIFICATION</strong>
                  <p>
                    Certified equipment can be connected to secure digital
                    verification technology for simple status checking.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="std-equipment-statement">
            <span>THE OBJECTIVE</span>
            <strong>
              HIGH TECHNICAL CONFIDENCE.
              <br />
              LOW ADMINISTRATIVE FRICTION.
            </strong>

            <div>
              <b>MEASURE</b>
              <i />
              <b>VERIFY</b>
              <i />
              <b>TRUST</b>
            </div>
          </div>
        </div>
      </section>

      {/* 05 — PEOPLE CERTIFICATION */}
      <section className="std-section std-people">
        <div className="section-shell">
          <p className="std-kicker light">
            <b>05</b> PEOPLE & CERTIFICATION
          </p>

          <div className="std-people-title">
            <h2>
              Develop the
              <br />
              <em>people.</em>
            </h2>

            <p>
              Certification should represent demonstrated capability, not simply
              attendance.
            </p>
          </div>

          <div className="std-people-visual-grid">

            <article className="std-people-card">
              <div className="std-people-photo">
                <img
                  className="std-photo-img"
                  src="/images/wpu-standards-coaching.png"
                  alt="Pickleball coach working with players on court"
                />
                <div className="std-people-photo-shade" />

                <div className="std-people-number">01</div>

                <div className="std-people-photo-title">
                  <span>COACHING CERTIFICATION</span>
                  <h3>
                    Teach.
                    <br />
                    Develop.
                    <br />
                    <em>Progress.</em>
                  </h3>
                </div>
              </div>

              <div className="std-people-content">
                <p>
                  WPU intends to establish a progressive international coaching
                  pathway from grassroots instruction through advanced and
                  high-performance coaching.
                </p>

                <div className="std-people-path">
                  <span>LEARN</span>
                  <i />
                  <span>PRACTISE</span>
                  <i />
                  <span>DEMONSTRATE</span>
                  <i />
                  <span>PROGRESS</span>
                </div>

                <small>
                  TECHNICAL KNOWLEDGE · TEACHING ABILITY · PLAYER DEVELOPMENT ·
                  SAFETY · ETHICS
                </small>
              </div>
            </article>

            <article className="std-people-card">
              <div className="std-people-photo">
                <img
                  className="std-photo-img"
                  src="/images/wpu-standards-officiating.png"
                  alt="Pickleball official managing a competitive match"
                />
                <div className="std-people-photo-shade" />

                <div className="std-people-number">02</div>

                <div className="std-people-photo-title">
                  <span>OFFICIATING CERTIFICATION</span>
                  <h3>
                    Know.
                    <br />
                    Apply.
                    <br />
                    <em>Officiate.</em>
                  </h3>
                </div>
              </div>

              <div className="std-people-content">
                <p>
                  WPU intends to establish a structured pathway for referees and
                  officials, progressing from rules knowledge to practical national
                  and international competition experience.
                </p>

                <div className="std-people-path">
                  <span>LEARN</span>
                  <i />
                  <span>ASSESS</span>
                  <i />
                  <span>OFFICIATE</span>
                  <i />
                  <span>PROGRESS</span>
                </div>

                <small>
                  RULE APPLICATION · MATCH MANAGEMENT · PROFESSIONALISM ·
                  INTEGRITY · PRACTICAL COMPETENCE
                </small>
              </div>
            </article>

          </div>
        </div>
      </section>

      {/* 06 — COURTS */}
      <section className="std-section std-courts">
        <div className="section-shell std-two-column">
          <div>
            <p className="std-kicker">
              <b>06</b> COURTS & FACILITIES
            </p>

            <h2>
              A reliable
              <br />
              place to <em>play.</em>
            </h2>

            <p className="std-section-intro">
              Standards can protect consistency and safety without making
              grassroots participation unnecessarily expensive.
            </p>
          </div>

          <div className="std-court-blueprint">
            <div className="std-blueprint-top">
              <span>WPU / COURT SYSTEM</span>
              <span>TECHNICAL REFERENCE</span>
            </div>

            <div className="std-court-stage">
              <div className="std-clearance-boundary">
                <span className="std-clearance-label">RECOMMENDED PLAY AREA</span>

                <div className="std-court">
                  <div className="std-court-center-line" />
                  <div className="std-court-net" />
                  <div className="std-kitchen std-kitchen-left" />
                  <div className="std-kitchen std-kitchen-right" />

                  <span className="std-zone-label std-zone-left">
                    NON-VOLLEY
                    <br />
                    ZONE
                  </span>

                  <span className="std-zone-label std-zone-right">
                    NON-VOLLEY
                    <br />
                    ZONE
                  </span>

                  <div className="std-dimension std-dimension-width">
                    <i />
                    <span>COURT WIDTH</span>
                    <i />
                  </div>

                  <div className="std-dimension std-dimension-length">
                    <i />
                    <span>COURT LENGTH</span>
                    <i />
                  </div>
                </div>
              </div>

              <div className="std-court-callout std-callout-a">
                <b>01</b>
                <span>DIMENSIONS</span>
                <i />
              </div>

              <div className="std-court-callout std-callout-b">
                <b>02</b>
                <span>PLAYING SURFACE</span>
                <i />
              </div>

              <div className="std-court-callout std-callout-c">
                <b>03</b>
                <span>NET</span>
                <i />
              </div>

              <div className="std-court-callout std-callout-d">
                <b>04</b>
                <span>SAFETY CLEARANCE</span>
                <i />
              </div>
            </div>

            <div className="std-court-specs">
              <div>
                <span>01</span>
                <strong>DIMENSIONS</strong>
                <p>Consistent court geometry creates a common playing environment.</p>
              </div>

              <div>
                <span>02</span>
                <strong>SURFACE</strong>
                <p>Practical guidance for predictable, safe and suitable play.</p>
              </div>

              <div>
                <span>03</span>
                <strong>NET</strong>
                <p>Consistent equipment positioning supports reliable competition.</p>
              </div>

              <div>
                <span>04</span>
                <strong>SAFETY</strong>
                <p>Appropriate surrounding space supports movement and player welfare.</p>
              </div>
            </div>

            <div className="std-facility-levels">
              <div className="std-facility-level-label">
                <span>FACILITY APPLICATION</span>
                <strong>One court. Different operating environments.</strong>
              </div>

              <div className="std-facility-level-track">
                <div>
                  <b>COMMUNITY</b>
                  <span>Accessible play</span>
                </div>
                <i />
                <div>
                  <b>COMPETITION</b>
                  <span>Consistent delivery</span>
                </div>
                <i />
                <div>
                  <b>INTERNATIONAL</b>
                  <span>Controlled environment</span>
                </div>
              </div>
            </div>

            <div className="std-court-note">
              <span>PLAYING STANDARD</span>
              <p>
                Core playing requirements establish consistency on court.
                Facility guidance can scale according to the level and purpose
                of the venue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 07 — RULES */}
      <section className="std-section std-rules">
        <div className="section-shell">

          <div className="std-heading-row">
            <div>
              <p className="std-kicker light">
                <b>07</b> RULES OF PLAY
              </p>
              <h2>
                One game.
                <br />
                <em>Understood everywhere.</em>
              </h2>
            </div>

            <p>
              WPU intends to develop and maintain rules that are clear,
              practical and internationally consistent so the same game can
              be understood wherever pickleball is played.
            </p>
          </div>

          <div className="std-rules-system">

            <div className="std-rules-board">

              <div className="std-rules-court">
                <div className="std-rules-net" />
                <div className="std-rules-kitchen std-rules-kitchen-top" />
                <div className="std-rules-kitchen std-rules-kitchen-bottom" />
                <div className="std-rules-service-line std-rules-service-top" />
                <div className="std-rules-service-line std-rules-service-bottom" />

                <div className="std-rules-ball std-rules-ball-one" />
                <div className="std-rules-ball std-rules-ball-two" />
                <div className="std-rules-trajectory std-rules-trajectory-one" />
                <div className="std-rules-trajectory std-rules-trajectory-two" />
              </div>

              <div className="std-rule-moment std-rule-serve">
                <span>01</span>
                <strong>SERVE</strong>
                <p>Start the point consistently.</p>
              </div>

              <div className="std-rule-moment std-rule-bounce">
                <span>02</span>
                <strong>BOUNCE</strong>
                <p>Understand when the ball must bounce.</p>
              </div>

              <div className="std-rule-moment std-rule-kitchen">
                <span>03</span>
                <strong>KITCHEN</strong>
                <p>Know where volley restrictions apply.</p>
              </div>

              <div className="std-rule-moment std-rule-lines">
                <span>04</span>
                <strong>LINES</strong>
                <p>Make clear and consistent calls.</p>
              </div>

            </div>

            <div className="std-rules-principle">
              <span>THE PRINCIPLE</span>

              <h3>
                One game.
                <br />
                <em>One shared understanding.</em>
              </h3>

              <p>
                Rules should make competition easier to understand and deliver,
                not introduce unnecessary complexity.
              </p>
            </div>

            <div className="std-rules-strip">
              <div>
                <span>01</span>
                <strong>CLEAR</strong>
                <p>Easy to understand.</p>
              </div>

              <i />

              <div>
                <span>02</span>
                <strong>PRACTICAL</strong>
                <p>Works on a real court.</p>
              </div>

              <i />

              <div>
                <span>03</span>
                <strong>CONSISTENT</strong>
                <p>The same game across borders.</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 08 — COMPETITION + INTEGRITY */}
      <section className="std-section std-system std-trust-system">
        <div className="section-shell">

          <div className="std-heading-row">
            <div>
              <p className="std-kicker">
                <b>08</b> COMPETITION &amp; INTEGRITY
              </p>

              <h2>
                Protect the game.
                <br />
                <em>Earn trust.</em>
              </h2>
            </div>

            <p>
              WPU intends to develop practical competition, integrity and safety
              frameworks that support consistent international delivery while
              protecting participants and the credibility of the sport.
            </p>
          </div>

          <div className="std-trust-board">

            <div className="std-trust-column">
              <div className="std-trust-head">
                <span>01</span>
                <div>
                  <small>THE COMPETITION</small>
                  <h3>COMPETITION<br />STANDARDS</h3>
                </div>
              </div>

              <div className="std-trust-items">
                <span>COMPETITION REGULATIONS</span>
                <span>EVENT OPERATIONS</span>
                <span>DRAWS &amp; FORMATS</span>
                <span>ELIGIBILITY</span>
                <span>RESULTS &amp; RANKINGS</span>
              </div>
            </div>

            <div className="std-trust-core">
              <span>THE OUTCOME</span>

              <div className="std-trust-ring">
                <div>
                  <small>WPU</small>
                  <strong>TRUST</strong>
                </div>
              </div>

              <div className="std-trust-flow">
                <b>CLEAR RULES</b>
                <i />
                <b>CONSISTENT DELIVERY</b>
                <i />
                <b>TRUSTED COMPETITION</b>
              </div>
            </div>

            <div className="std-trust-column">
              <div className="std-trust-head">
                <span>02</span>
                <div>
                  <small>THE PEOPLE</small>
                  <h3>INTEGRITY &amp;<br />SAFETY</h3>
                </div>
              </div>

              <div className="std-trust-items">
                <span>FAIR PLAY</span>
                <span>SAFEGUARDING</span>
                <span>ANTI-MANIPULATION</span>
                <span>CONDUCT</span>
                <span>PLAYER WELFARE</span>
              </div>
            </div>

          </div>

          <div className="std-trust-statement">
            <span>WHY IT MATTERS</span>

            <strong>
              STANDARDS SHOULD PROTECT THE GAME —
              <br />
              NOT GET IN ITS WAY.
            </strong>

            <p>
              Enough structure to create confidence and consistency without
              unnecessary complexity.
            </p>
          </div>

        </div>
      </section>

      {/* 09 — STANDARDS LIBRARY */}
      <section className="std-section std-library">
        <div className="section-shell">

          <div className="std-heading-row">
            <div>
              <p className="std-kicker">
                <b>09</b> STANDARDS LIBRARY
              </p>

              <h2>
                Clear standards.
                <br />
                <em>Published openly.</em>
              </h2>
            </div>

            <p>
              WPU intends to publish its standards and technical frameworks
              clearly so players, federations, organisers, officials,
              coaches and manufacturers can understand what is expected.
            </p>
          </div>

          <div className="std-library-grid">
            {library.map(([number, title, status]) => (
              <article key={title}>
                <span>{number}</span>
                <h3>{title}</h3>
                <small>{status}</small>
              </article>
            ))}
          </div>

          <div className="std-library-status">
            <span>CURRENT STATUS</span>
            <div>
              <i />
              <p>
                WPU standards and certification frameworks are currently
                in development.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 10 — INVITATION */}
      <section className="std-section std-build">
        <div className="section-shell">

          <div className="std-build-grid">
            <div>
              <p className="std-kicker light">
                <b>10</b> HELP BUILD THE STANDARD
              </p>

              <h2>
                Standards work better
                <br />
                <em>when the sport contributes.</em>
              </h2>
            </div>

            <div>
              <p>
                WPU welcomes constructive participation from national
                federations, athletes, coaches, officials, organisers,
                manufacturers and technical specialists as these frameworks
                are developed.
              </p>

              <Link href="/#members" className="std-build-action">
                EXPRESS INTEREST →
              </Link>
            </div>
          </div>

          <div className="std-build-principle">
            <span>OUR APPROACH</span>
            <strong>
              LISTEN WIDELY. BUILD PRACTICALLY. KEEP THE SPORT ACCESSIBLE.
            </strong>
          </div>

          <div className="std-standards-signature">
            <span>MEASURE</span>
            <i />
            <span>VERIFY</span>
            <i />
            <span>TRUST</span>
          </div>

        </div>
      </section>

      {/* FINAL */}
      <section className="final-cta std-final">
        <div className="section-shell">

          <p className="std-kicker">
            WORLD PICKLEBALL UNION
          </p>

          <h2>
            High standards.
            <br />
            <em>Open pathways.</em>
          </h2>

          <div className="std-final-bottom">
            <p>
              WPU is building an international standards framework designed
              to create confidence, consistency and opportunity across the sport.
            </p>

            <Link href="/#members">
              HELP BUILD THE STANDARD →
            </Link>
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
