import Image from "next/image";

const pillars = [
  {
    number: "01",
    title: "Governance",
    text: "A clear international framework built around accountability, representation and integrity.",
  },
  {
    number: "02",
    title: "Competition",
    text: "A connected pathway from national participation to continental and world competition.",
  },
  {
    number: "03",
    title: "Development",
    text: "Supporting players, coaches, officials and organisations as pickleball grows worldwide.",
  },
  {
    number: "04",
    title: "Standards",
    text: "Practical, accessible standards that support fair play without creating unnecessary barriers.",
  },
];

const principles = [
  ["01", "Independent", "Built as a standalone international sporting organisation."],
  ["02", "Non-profit", "Resources reinvested into the development of the sport."],
  ["03", "Global", "Connecting pickleball communities across nations and regions."],
  ["04", "Transparent", "Clear governance, standards and sporting processes."],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <div className="nav-shell">
          <a className="brand" href="#top" aria-label="World Pickleball Union">
            <Image
              src="/brand/wpu-logo.svg"
              alt="World Pickleball Union"
              width={240}
              height={80}
              priority
            />
          </a>

          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#about">About</a>
            <a href="#governance">Governance</a>
            <a href="#members">Members</a>
            <a href="#competition">Competitions</a>
            <a href="#standards">Standards</a>
            <a href="#development">Development</a>
          </nav>

          <a className="nav-cta" href="#members">
            Join WPU
          </a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">WORLD PICKLEBALL UNION</p>

          <h1>
            Uniting
            <br />
            Pickleball
            <br />
            Worldwide.
          </h1>

          <p className="hero-intro">
            World Pickleball Union is being established as an international
            non-profit governing body supporting the global development of
            pickleball through cooperation, competition, standards and
            integrity.
          </p>

          <div className="hero-actions">
            <a className="button-primary" href="#about">
              Explore WPU <span>→</span>
            </a>
            <a className="button-secondary" href="#members">
              Membership
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <Image
            className="hero-photo"
            src="/images/wpu-hero-pickleball.png"
            alt="Pickleball player competing on court"
            fill
            sizes="(max-width: 900px) 100vw, 58vw"
            priority
          />

          <div className="hero-shade" />

          <svg
            className="hero-flight"
            viewBox="0 0 900 480"
            aria-hidden="true"
          >
            <path
              d="M25 410 C230 140 525 80 825 120"
              fill="none"
              stroke="#0B205B"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M20 390 C250 105 560 68 850 125"
              fill="none"
              stroke="#D9F93C"
              strokeWidth="15"
              strokeLinecap="round"
            />
          </svg>

          <div className="hero-message">
            <span>ONE SPORT. MANY NATIONS.</span>
            <strong>
              A stronger future
              <br />
              together.
            </strong>
          </div>
        </div>
      </section>

      <section className="principles" aria-label="WPU principles">
        <div className="principles-inner">
          {principles.map(([number, title, text]) => (
            <article className="principle" key={number}>
              <span>{number}</span>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about section-shell" id="about">
        <div className="section-label">
          <span>01</span>
          <p>ABOUT WPU</p>
        </div>

        <div className="about-grid">
          <div>
            <h2>
              One sport.
              <br />
              <em>Many nations.</em>
            </h2>
          </div>

          <div className="about-copy">
            <p className="large-copy">
              Pickleball is growing across borders, cultures and communities.
              WPU is being built to help connect that growth through a simple,
              credible international framework.
            </p>
            <p>
              The objective is not to make the sport more complicated. It is
              to create the structures that allow national organisations,
              athletes, coaches, officials, event organisers and equipment
              brands to participate in a wider international ecosystem.
            </p>
          </div>
        </div>

        <div className="statement">
          <div className="statement-mark">
            <span className="ball-dot" />
            <span className="swoosh swoosh-one" />
            <span className="swoosh swoosh-two" />
          </div>
          <p>UNITING PICKLEBALL WORLDWIDE.</p>
        </div>
      </section>

      <section className="navy-section" id="governance">
        <div className="section-shell">
          <div className="section-label light">
            <span>02</span>
            <p>WHAT WE ARE BUILDING</p>
          </div>

          <div className="section-heading-row">
            <h2>
              A global framework
              <br />
              <em>for the sport.</em>
            </h2>
            <p>
              Four connected areas form the foundation of WPU&apos;s
              international role.
            </p>
          </div>

          <div className="pillar-grid">
            {pillars.map((pillar) => (
              <article className="pillar-card" key={pillar.number}>
                <span>{pillar.number}</span>
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
                <a href={`#${pillar.title.toLowerCase()}`}>Explore →</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="competition section-shell" id="competition">
        <div className="section-label">
          <span>03</span>
          <p>COMPETITION</p>
        </div>

        <div className="competition-grid">
          <div>
            <h2>
              From local courts
              <br />
              <em>to the world stage.</em>
            </h2>
            <p className="competition-intro">
              WPU intends to support a connected competition pathway while
              respecting the role of national and regional organisations.
            </p>
          </div>

          <div className="pathway">
            <div className="path-step">
              <span>01</span>
              <strong>National</strong>
              <small>Participation & development</small>
            </div>
            <div className="path-arrow">→</div>
            <div className="path-step">
              <span>02</span>
              <strong>Continental</strong>
              <small>Regional competition</small>
            </div>
            <div className="path-arrow">→</div>
            <div className="path-step active">
              <span>03</span>
              <strong>World</strong>
              <small>International competition</small>
            </div>
          </div>
        </div>
      </section>

      <section className="standards" id="standards">
        <div className="section-shell standards-grid">
          <div>
            <div className="section-label">
              <span>04</span>
              <p>STANDARDS</p>
            </div>

            <h2>
              Simple standards.
              <br />
              <em>Open participation.</em>
            </h2>

            <p className="large-copy standards-copy">
              WPU standards are intended to protect fair competition while
              keeping participation practical and accessible for the global
              pickleball community.
            </p>

            <p>
              Equipment certification, technical standards and public
              verification systems are in development.
            </p>
          </div>

          <div className="certification-visual">
            <Image
              src="/images/wpu-approved-certification-mark.svg"
              alt="WPU Approved — Certified for Competition"
              width={520}
              height={624}
              className="certification-mark"
            />
            <div className="certification-status">
              <span>PUBLIC VERIFICATION</span>
              <strong>COMING SOON</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="members navy-section" id="members">
        <div className="section-shell members-grid">
          <div>
            <div className="section-label light">
              <span>05</span>
              <p>MEMBERSHIP</p>
            </div>

            <h2>
              Built with the
              <br />
              <em>world in mind.</em>
            </h2>
          </div>

          <div className="members-copy">
            <p className="large-copy">
              WPU is developing a membership framework for national pickleball
              organisations that share a commitment to cooperation,
              accessibility and responsible growth.
            </p>
            <a className="button-lime" href="mailto:membership@worldpickleball.world">
              Membership enquiries →
            </a>
          </div>
        </div>
      </section>

      <section className="development section-shell" id="development">
        <div className="section-label">
          <span>06</span>
          <p>DEVELOPMENT</p>
        </div>

        <div className="development-heading">
          <h2>
            Grow the game.
            <br />
            <em>Grow it together.</em>
          </h2>
          <p>
            International development should create more opportunities to
            participate, learn, compete and contribute.
          </p>
        </div>

        <div className="development-list">
          {[
            "Athletes",
            "Coaches",
            "Officials",
            "Youth",
            "National Bodies",
            "Emerging Nations",
          ].map((item, index) => (
            <div key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item}</strong>
            </div>
          ))}
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
          <a href="mailto:info@worldpickleball.world">Connect with WPU →</a>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <Image
            src="/brand/wpu-logo.svg"
            alt="World Pickleball Union"
            width={220}
            height={75}
          />

          <div className="footer-copy">
            <p>UNITING PICKLEBALL WORLDWIDE.</p>
            <small>
              © {new Date().getFullYear()} World Pickleball Union. All rights
              reserved.
            </small>
          </div>
        </div>
      </footer>
    </main>
  );
}
