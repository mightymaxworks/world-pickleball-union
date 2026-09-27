import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Development",
  description:
    "Explore the World Pickleball Union's developing approach to participation, people, pathways and sustainable pickleball development worldwide.",
  alternates: {
    canonical: "/development",
  },
  openGraph: {
    title: "Development | World Pickleball Union",
    description:
      "Supporting the development of pickleball through participation, people, pathways and sustainable national capacity.",
    url: "/development",
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
    title: "Development | World Pickleball Union",
    description:
      "Supporting the development of pickleball through participation, people, pathways and sustainable national capacity.",
    images: ["/opengraph-image.png"],
  },
};

const pillars = [
  {
    number: "01",
    title: "Participation",
    text: "Create more opportunities for people to discover, learn and enjoy pickleball.",
  },
  {
    number: "02",
    title: "People",
    text: "Support the development of coaches, officials, organisers and volunteers who help the sport grow.",
  },
  {
    number: "03",
    title: "Pathways",
    text: "Connect participation with structured opportunities to develop, compete and progress.",
  },
  {
    number: "04",
    title: "National Capacity",
    text: "Help organisations develop sustainable structures suited to the needs and maturity of pickleball in their country.",
  },
];

const pathway = [
  ["01", "Discover", "First contact with the sport."],
  ["02", "Play", "Regular participation and enjoyment."],
  ["03", "Develop", "Skills, coaching and structured progression."],
  ["04", "Compete", "Local, national and international opportunities."],
  ["05", "Represent", "The pathway toward representing a community or nation."],
];

const people = [
  {
    number: "01",
    title: "Coaches",
    text: "Developing people who can introduce the sport well, improve players and build positive sporting environments.",
  },
  {
    number: "02",
    title: "Officials",
    text: "Building rules knowledge, practical experience and pathways for referees and competition officials.",
  },
  {
    number: "03",
    title: "Organisers",
    text: "Supporting the people who turn courts, clubs and communities into sustainable pickleball activity.",
  },
  {
    number: "04",
    title: "Volunteers",
    text: "Recognising the people whose time and energy make grassroots sport possible.",
  },
];

export default function DevelopmentPage() {
  return (
    <main className="development-page">
      <header className="site-header wpu-shared-header">
        <div className="nav-shell">
          <Link className="brand" href="/" aria-label="World Pickleball Union home">
            <Image
              src="/brand/wpu-logo-approved.png"
              alt="World Pickleball Union"
              width={640}
              height={210}
              priority
            />
          </Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <Link href="/about">About</Link>
            <Link href="/governance">Governance</Link>
            <Link href="/members">Members</Link>
            <Link href="/competitions">Competitions</Link>
            <Link href="/standards">Standards</Link>
            <Link href="/development">Development</Link>
          </nav>

          <Link className="nav-cta" href="/members">
            Join WPU
          </Link>

          <details className="mobile-nav">
            <summary aria-label="Open navigation">
              <span />
              <span />
              <span />
            </summary>
            <nav aria-label="Mobile navigation">
              <Link href="/about">About</Link>
              <Link href="/governance">Governance</Link>
              <Link href="/members">Members</Link>
              <Link href="/competitions">Competitions</Link>
              <Link href="/standards">Standards</Link>
              <Link href="/development">Development</Link>
              <Link className="mobile-nav-join" href="/members">
                Join WPU <span>→</span>
              </Link>
            </nav>
          </details>
        </div>
      </header>

      <section className="dev-hero">
        <div className="section-shell dev-hero-inner">
          <div className="dev-hero-copy">
            <p className="dev-kicker">WPU / DEVELOPMENT</p>

            <h1>
              Growing the Game.
              <br />
              <em>Building the Future.</em>
            </h1>

            <p className="dev-hero-intro">
              Sustainable growth is about more than increasing player numbers.
              It means developing the people, pathways and organisations that
              allow pickleball to grow for the long term.
            </p>

            <div className="dev-hero-actions">
              <a href="#pathway" className="button-primary">
                Explore the pathway <span>→</span>
              </a>
            </div>
          </div>

          <div className="dev-hero-visual">
            <div className="dev-hero-photo">
              <Image
                src="/images/wpu-development-hero.png"
                alt="Young pickleball player developing her game on court"
                fill
                priority
                sizes="(max-width: 1050px) 100vw, 50vw"
              />
              <div className="dev-hero-photo-shade" />
            </div>

            <div className="dev-hero-system" aria-label="WPU development pathway">
              <div className="dev-orbit dev-orbit-one" />
            <div className="dev-orbit dev-orbit-two" />

            <div className="dev-system-core">
              <span>WPU</span>
              <strong>DEVELOPMENT</strong>
            </div>

            <div className="dev-system-node dev-node-one">
              <b>01</b>
              <span>PLAY</span>
            </div>
            <div className="dev-system-node dev-node-two">
              <b>02</b>
              <span>LEARN</span>
            </div>
            <div className="dev-system-node dev-node-three">
              <b>03</b>
              <span>GROW</span>
            </div>
            <div className="dev-system-node dev-node-four">
              <b>04</b>
              <span>COMPETE</span>
            </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dev-mission">
        <div className="section-shell dev-mission-grid">
          <div>
            <p className="dev-section-label">
              <b>01</b> DEVELOPMENT MISSION
            </p>

            <h2>
              Growth needs
              <br />
              <em>a pathway.</em>
            </h2>
          </div>

          <div className="dev-mission-copy">
            <p className="dev-lead">
              A sport becomes stronger when the whole ecosystem develops
              together.
            </p>

            <p>
              WPU intends to support development from first participation
              through to organised competition, while recognising that every
              country and community begins from a different starting point.
            </p>

            <p>
              Development should create opportunity without unnecessary
              barriers and provide practical ways for players, coaches,
              officials, organisers and national organisations to progress.
            </p>
          </div>
        </div>
      </section>

      <section className="dev-pillars">
        <div className="section-shell">
          <div className="dev-section-heading">
            <div>
              <p className="dev-section-label dev-section-label-light">
                <b>02</b> FOUR PILLARS
              </p>
              <h2>
                Building the sport
                <br />
                <em>from the ground up.</em>
              </h2>
            </div>

            <p>
              A simple development framework designed to strengthen the
              foundations of pickleball.
            </p>
          </div>

          <div className="dev-pillar-grid">
            {pillars.map((pillar) => (
              <article className="dev-pillar-card" key={pillar.number}>
                <span>{pillar.number}</span>
                <div className="dev-pillar-line" />
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dev-pathway" id="pathway">
        <div className="section-shell">
          <div className="dev-pathway-heading">
            <p className="dev-section-label">
              <b>03</b> PLAYER PATHWAY
            </p>

            <h2>
              Start anywhere.
              <br />
              <em>Keep moving forward.</em>
            </h2>

            <p>
              Development should make the next opportunity visible without
              suggesting that every participant must follow the same journey.
            </p>
          </div>

          <div className="dev-pathway-track">
            {pathway.map((stage, index) => (
              <div className="dev-pathway-stage" key={stage[0]}>
                <div className="dev-stage-top">
                  <span>{stage[0]}</span>
                  {index < pathway.length - 1 && <i>→</i>}
                </div>
                <h3>{stage[1]}</h3>
                <p>{stage[2]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dev-people">
        <div className="section-shell">
          <div className="dev-people-intro">
            <div>
              <p className="dev-section-label">
                <b>04</b> PEOPLE WHO GROW THE GAME
              </p>

              <h2>
                Players need
                <br />
                <em>people around them.</em>
              </h2>
            </div>

            <p>
              Sustainable sport depends on capable people both on and beyond
              the court.
            </p>
          </div>

          <div className="dev-people-photo">
            <Image
              src="/images/wpu-development-coaching.png"
              alt="Pickleball coach working with a developing junior player"
              fill
              sizes="(max-width: 700px) 100vw, 45vw"
            />
            <div className="dev-people-photo-shade" />
            <div className="dev-people-photo-label">
              <span>DEVELOP PEOPLE</span>
              <strong>Teach. Support. Grow.</strong>
            </div>
          </div>

          <div className="dev-people-grid">
            {people.map((person) => (
              <article key={person.number}>
                <span>{person.number}</span>
                <h3>{person.title}</h3>
                <p>{person.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dev-emerging">
        <div className="section-shell dev-emerging-grid">
          <div className="dev-emerging-map" aria-hidden="true">
            <span className="dev-map-dot dot-a" />
            <span className="dev-map-dot dot-b" />
            <span className="dev-map-dot dot-c" />
            <span className="dev-map-dot dot-d" />
            <span className="dev-map-dot dot-e" />

            <div className="dev-map-line line-a" />
            <div className="dev-map-line line-b" />
            <div className="dev-map-line line-c" />

            <strong>LOCAL</strong>
            <b>→</b>
            <strong>NATIONAL</strong>
            <b>→</b>
            <strong>GLOBAL</strong>
          </div>

          <div className="dev-emerging-copy">
            <p className="dev-section-label dev-section-label-light">
              <b>05</b> EMERGING PICKLEBALL NATIONS
            </p>

            <h2>
              Different starting points.
              <br />
              <em>One global game.</em>
            </h2>

            <p>
              Pickleball is developing at different speeds around the world.
              A useful international framework should recognise those
              differences rather than assume every nation has the same
              resources, participation base or sporting infrastructure.
            </p>

            <p>
              WPU intends to develop practical pathways that can support both
              established and emerging pickleball communities.
            </p>
          </div>
        </div>
      </section>

      <section className="dev-youth">
        <div className="section-shell dev-youth-grid">
          <div>
            <p className="dev-section-label">
              <b>06</b> YOUTH & FUTURE GENERATIONS
            </p>

            <h2>
              Give the next generation
              <br />
              <em>a place to begin.</em>
            </h2>
          </div>

          <div className="dev-youth-side">
            <div className="dev-youth-photo">
              <Image
                src="/images/wpu-development-youth.png"
                alt="Young pickleball players enjoying an organised session"
                fill
                sizes="(max-width: 1050px) 100vw, 50vw"
              />
            </div>

            <div className="dev-youth-copy">
              <p>
                Long-term development begins by making pickleball accessible,
                understandable and enjoyable for young people.
              </p>

            <div className="dev-youth-points">
              <span>Schools</span>
              <span>Introductory programmes</span>
              <span>Youth participation</span>
              <span>Player development</span>
            </div>

              <small>
                WPU youth development frameworks and resources are in
                development.
              </small>
            </div>
          </div>
        </div>
      </section>

      <section className="dev-resources">
        <div className="section-shell dev-resources-inner">
          <div>
            <p className="dev-section-label dev-section-label-light">
              <b>07</b> KNOWLEDGE & RESOURCES
            </p>

            <h2>
              Share what works.
              <br />
              <em>Grow together.</em>
            </h2>
          </div>

          <div className="dev-resource-list">
            <div>
              <span>01</span>
              <strong>Development Frameworks</strong>
              <small>In development</small>
            </div>
            <div>
              <span>02</span>
              <strong>Education Resources</strong>
              <small>In development</small>
            </div>
            <div>
              <span>03</span>
              <strong>Technical Guidance</strong>
              <small>In development</small>
            </div>
            <div>
              <span>04</span>
              <strong>Shared Good Practice</strong>
              <small>In development</small>
            </div>
          </div>
        </div>
      </section>

      <section className="dev-final">
        <div className="section-shell dev-final-inner">
          <p>WORLD PICKLEBALL UNION / DEVELOPMENT</p>

          <h2>
            Every nation
            <br />
            <em>starts somewhere.</em>
          </h2>

          <div className="dev-final-action">
            <p>
              WPU is building an international development framework designed
              to help pickleball communities take their next step.
            </p>

            <Link href="/members">
              Explore Membership <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-inner">
          <Link className="footer-brand" href="/">
            <Image
              src="/brand/wpu-logo-approved.png"
              alt="World Pickleball Union"
              width={640}
              height={210}
            />
          </Link>

          <div className="footer-copy">
            <strong>UNITING PICKLEBALL WORLDWIDE.</strong>
            <span>WORLD PICKLEBALL UNION</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
