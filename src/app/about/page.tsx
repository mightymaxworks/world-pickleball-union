import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "About WPU",
  description:
    "Learn about the World Pickleball Union and its purpose, principles and vision for the international development of pickleball.",
};

const principles = [
  {
    number: "01",
    title: "Independent",
    text: "Governance should serve the sport and its participants, with clear responsibilities and accountable decision-making.",
  },
  {
    number: "02",
    title: "Non-profit",
    text: "WPU is being developed around a non-profit model focused on the long-term development of pickleball.",
  },
  {
    number: "03",
    title: "Global",
    text: "International development should connect established and emerging pickleball nations within one global framework.",
  },
  {
    number: "04",
    title: "Transparent",
    text: "Rules, standards, governance processes and pathways should be understandable and openly communicated.",
  },
];

const responsibilities = [
  ["01", "Governance", "Develop clear international governance structures for the sport."],
  ["02", "Competition", "Create coherent pathways from national participation toward international competition."],
  ["03", "Standards", "Establish practical standards that protect fair play without creating unnecessary barriers."],
  ["04", "Development", "Support athletes, coaches, officials, youth programmes and emerging pickleball communities."],
  ["05", "Membership", "Build a framework through which national organisations can participate in WPU."],
  ["06", "Cooperation", "Encourage collaboration across borders while respecting the development of pickleball in each country."],
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <SiteHeader />

      <section
        style={{
          background: "var(--cream)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          className="section-shell"
          style={{
            minHeight: "610px",
            display: "grid",
            gridTemplateColumns: "1fr .72fr",
            gap: "100px",
            alignItems: "center",
            paddingTop: "100px",
            paddingBottom: "100px",
          }}
        >
          <div>
            <p className="eyebrow">WORLD PICKLEBALL UNION</p>

            <h1
              style={{
                margin: 0,
                maxWidth: "900px",
                fontSize: "clamp(58px, 6vw, 98px)",
                lineHeight: ".91",
                letterSpacing: "-.065em",
                fontWeight: 900,
              }}
            >
              One sport.
              <br />
              Many nations.
              <br />
              <span style={{ position: "relative" }}>One global framework.</span>
            </h1>
          </div>

          <div
            style={{
              borderLeft: "4px solid var(--lime)",
              paddingLeft: "32px",
            }}
          >
            <p
              style={{
                margin: 0,
                maxWidth: "570px",
                fontSize: "21px",
                lineHeight: 1.6,
                fontWeight: 600,
              }}
            >
              The World Pickleball Union is being established as an
              international non-profit governing body for pickleball.
            </p>

            <p
              style={{
                margin: "28px 0 0",
                maxWidth: "570px",
                color: "#667188",
                fontSize: "14px",
                lineHeight: 1.8,
              }}
            >
              Its purpose is to help create a clear, inclusive and practical
              international framework through which the sport can develop
              across nations.
            </p>
          </div>
        </div>
      </section>

      <section style={{ background: "white", padding: "130px 0" }}>
        <div className="section-shell">
          <div className="section-label">
            <span>01</span>
            <p>WHY WPU EXISTS</p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: ".85fr 1.15fr",
              gap: "130px",
              alignItems: "start",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "clamp(48px, 5vw, 76px)",
                lineHeight: ".98",
                letterSpacing: "-.055em",
                fontWeight: 900,
              }}
            >
              Pickleball is growing beyond borders.
            </h2>

            <div style={{ maxWidth: "680px" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "22px",
                  lineHeight: 1.55,
                  fontWeight: 600,
                }}
              >
                The international structure surrounding the sport must be able
                to grow with it.
              </p>

              <p
                style={{
                  margin: "30px 0 0",
                  color: "#667188",
                  fontSize: "15px",
                  lineHeight: 1.85,
                }}
              >
                Pickleball is being played by increasingly diverse communities
                around the world. Different countries are developing at
                different speeds, with different resources, histories and
                priorities.
              </p>

              <p
                style={{
                  margin: "22px 0 0",
                  color: "#667188",
                  fontSize: "15px",
                  lineHeight: 1.85,
                }}
              >
                WPU is being built around a simple idea: international
                governance should make participation clearer and easier, not
                more complicated. A global framework should connect the sport
                while leaving room for nations to develop in ways appropriate
                to their own communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="navy-section">
        <div className="section-shell">
          <div className="section-label light">
            <span>02</span>
            <p>OUR PURPOSE</p>
          </div>

          <div className="section-heading-row">
            <h2>
              Build the structure.
              <br />
              <em>Grow the sport.</em>
            </h2>

            <p>
              WPU intends to provide a shared international framework while
              keeping participation practical, accessible and focused on the
              people who play and develop pickleball.
            </p>
          </div>

          <div
            style={{
              marginTop: "95px",
              padding: "55px 0",
              borderTop: "1px solid rgba(255,255,255,.2)",
              borderBottom: "1px solid rgba(255,255,255,.2)",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "50px",
            }}
          >
            <div>
              <span style={smallLimeLabel}>CONNECT</span>
              <h3 style={purposeHeading}>Nations</h3>
              <p style={purposeCopy}>
                Create meaningful ways for national pickleball organisations
                to participate internationally.
              </p>
            </div>

            <div>
              <span style={smallLimeLabel}>DEVELOP</span>
              <h3 style={purposeHeading}>People</h3>
              <p style={purposeCopy}>
                Strengthen pathways for players, coaches, officials,
                administrators and future generations.
              </p>
            </div>

            <div>
              <span style={smallLimeLabel}>ALIGN</span>
              <h3 style={purposeHeading}>The Sport</h3>
              <p style={purposeCopy}>
                Develop understandable standards and structures that support
                fair and credible international participation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "130px 0", background: "var(--cream)" }}>
        <div className="section-shell">
          <div className="section-label">
            <span>03</span>
            <p>WHAT WPU WILL DO</p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: ".75fr 1.25fr",
              gap: "130px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "clamp(48px, 5vw, 76px)",
                lineHeight: ".98",
                letterSpacing: "-.055em",
                fontWeight: 900,
              }}
            >
              A framework for the whole sport.
            </h2>

            <div style={{ borderTop: "1px solid var(--line)" }}>
              {responsibilities.map(([number, title, text]) => (
                <div
                  key={number}
                  className="about-responsibility"
                  style={{
                    minHeight: "115px",
                    display: "grid",
                    gridTemplateColumns: "75px 190px 1fr 35px",
                    gap: "20px",
                    alignItems: "center",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <span style={numberStyle}>{number}</span>
                  <strong style={{ fontSize: "18px" }}>{title}</strong>
                  <p
                    style={{
                      margin: 0,
                      color: "#667188",
                      fontSize: "13px",
                      lineHeight: 1.7,
                    }}
                  >
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "130px 0", background: "white" }}>
        <div className="section-shell">
          <div className="section-label">
            <span>04</span>
            <p>OUR PRINCIPLES</p>
          </div>

          <h2
            style={{
              margin: 0,
              maxWidth: "850px",
              fontSize: "clamp(48px, 5vw, 76px)",
              lineHeight: ".98",
              letterSpacing: "-.055em",
              fontWeight: 900,
            }}
          >
            The way we build matters.
          </h2>

          <div
            style={{
              marginTop: "80px",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              borderTop: "1px solid var(--line)",
              borderBottom: "1px solid var(--line)",
            }}
          >
            {principles.map((principle) => (
              <article
                key={principle.number}
                className="about-principle"
                data-number={principle.number}
                style={{
                  minHeight: "300px",
                  padding: "35px 30px",
                  borderRight: "1px solid var(--line)",
                }}
              >
                <span style={numberStyle}>{principle.number}</span>
                <h3
                  style={{
                    margin: "60px 0 16px",
                    fontSize: "24px",
                    letterSpacing: "-.03em",
                  }}
                >
                  {principle.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "#667188",
                    fontSize: "13px",
                    lineHeight: 1.75,
                  }}
                >
                  {principle.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-global" style={{ padding: "140px 0" }}>
        <div className="section-shell about-global-inner">
          <div className="section-label">
            <span>05</span>
            <p>A GLOBAL UNION</p>
          </div>

          <div className="about-global-layout">
          <div className="about-global-copy">
            <h2>
              Different nations.<br />
              Different stages.<br />
              <em>One place at the table.</em>
            </h2>

            <div className="about-global-statement">
              <strong>
                International pickleball should have room for every nation
                committed to developing the sport responsibly.
              </strong>

              <p>
                WPU is being designed so that established and emerging
                pickleball nations can both have a meaningful place in the
                international development of the sport. Different countries
                will grow at different speeds and in different ways. A global
                union should connect that progress rather than force every
                nation into the same mould.
              </p>
            </div>
          </div>

          <div className="wpu-world" aria-hidden="true">
            <div className="wpu-world-orbit"></div>
            <div className="wpu-world-axis"></div>
            <div className="wpu-world-axis vertical"></div>
            <div className="wpu-world-flight"></div>

            <span className="wpu-world-node n1"></span>
            <span className="wpu-world-node n2"></span>
            <span className="wpu-world-node n3 primary"></span>
            <span className="wpu-world-node n4"></span>
            <span className="wpu-world-node n5"></span>
            <span className="wpu-world-node n6"></span>
            <span className="wpu-world-node n7"></span>

            <span className="wpu-world-label">
              MANY NATIONS · ONE CONNECTED SPORT
            </span>
          </div>
          </div>
        </div>
      </section>

      <section className="navy-section">
        <div className="section-shell">
          <div className="section-label light">
            <span>06</span>
            <p>BUILDING WPU</p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr .75fr",
              gap: "130px",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                maxWidth: "800px",
                fontSize: "clamp(52px, 5.5vw, 86px)",
                lineHeight: ".94",
                letterSpacing: "-.06em",
                fontWeight: 900,
              }}
            >
              Built openly.
              <br />
              Built internationally.
              <br />
              <span style={{ color: "var(--lime)" }}>Built to last.</span>
            </h2>

            <div>
              <p style={darkLead}>
                WPU is currently in its establishment and development phase.
              </p>
              <p style={darkCopy}>
                Governance structures, membership frameworks, international
                standards, competition pathways and development programmes will
                be introduced progressively as the organisation develops.
              </p>
              <p style={darkCopy}>
                The objective is not to create complexity for its own sake. It
                is to build a credible international structure that can grow
                responsibly with the sport.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="section-shell final-inner">
          <p>WORLD PICKLEBALL UNION</p>
          <h2>
            One sport.
            <br />
            Many nations.
            <br />
            <em>One future.</em>
          </h2>
          <div className="about-final-action">
            <Link href="/#members">BUILD WITH WPU →</Link>
            <p>NATIONAL ORGANISATIONS · PARTNERS · CONTRIBUTORS</p>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <Link href="/" aria-label="World Pickleball Union home">
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

const smallLimeLabel = {
  color: "var(--lime)",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: ".2em",
} as const;

const purposeHeading = {
  margin: "35px 0 15px",
  color: "white",
  fontSize: "28px",
  letterSpacing: "-.035em",
} as const;

const purposeCopy = {
  margin: 0,
  maxWidth: "320px",
  color: "#b9c4d4",
  fontSize: "13px",
  lineHeight: 1.75,
} as const;

const numberStyle = {
  color: "var(--navy)",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: ".18em",
} as const;

const darkLead = {
  margin: 0,
  paddingLeft: "25px",
  borderLeft: "4px solid var(--lime)",
  color: "white",
  fontSize: "20px",
  fontWeight: 600,
  lineHeight: 1.6,
} as const;

const darkCopy = {
  margin: "27px 0 0",
  color: "#bec8d7",
  fontSize: "14px",
  lineHeight: 1.8,
} as const;
