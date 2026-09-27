import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import CompetitionEcosystem from "@/components/CompetitionEcosystem";
import NationalCompetitionPath from "@/components/NationalCompetitionPath";
import CompetitionRankingBoard from "@/components/CompetitionRankingBoard";

export const metadata = {
  title: "Competitions",
  description:
    "Explore the developing World Pickleball Union competition ecosystem connecting community, club and national pathways with international pickleball.",

  alternates: {
    canonical: "/competitions",
  },

  openGraph: {
    type: "website",
    url: "/competitions",
    siteName: "World Pickleball Union",
    title: "Competitions | World Pickleball Union",
    description:
      "Explore the developing World Pickleball Union competition ecosystem connecting community, club and national pathways with international pickleball.",
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
    title: "Competitions | World Pickleball Union",
    description:
      "Explore the developing World Pickleball Union competition ecosystem connecting community, club and national pathways with international pickleball.",
    images: ["/opengraph-image.png"],
  },
};


const formats = [
  ["01", "SOCIAL", "Accessible competition that brings people into the sport."],
  ["02", "LEAGUE", "Recurring competition that creates consistency and community."],
  ["03", "TOURNAMENT", "Structured events across appropriate levels of the ecosystem."],
  ["04", "CHAMPIONSHIP", "Competition for recognised titles within an adopted framework."],
  ["05", "TEAM", "Competition built around clubs, organisations and national representation."],
  ["06", "ELITE", "High-performance competition at the upper levels of the sport."],
];

const categories = [
  ["SINGLES", "Individual competition"],
  ["DOUBLES", "Two-player team competition"],
  ["MIXED DOUBLES", "Mixed team competition"],
  ["TEAM", "Club, regional and national team formats"],
  ["AGE", "Age-group competition where appropriate"],
  ["OPEN", "Additional classifications as frameworks develop"],
];

export default function CompetitionsPage() {
  return (
    <main className="competitions-page">
      <SiteHeader />

      {/* 01 — HERO */}
      <section className="comp-hero">
        <div className="comp-hero-media">
          <Image
            src="/images/wpu-competition-hero-v2.png"
            alt="International pickleball competition"
            fill
            priority
            sizes="100vw"
            className="comp-hero-image"
          />
          <div className="comp-hero-shade" />
        </div>

        <div className="comp-hero-content">
          <p className="comp-kicker">
            <b>01</b> COMPETITION
          </p>

          <h1>
            From the
            <br />
            first game
            <br />
            to the <em>world stage.</em>
          </h1>

          <p className="comp-hero-intro">
            WPU is developing a competition ecosystem that can connect the
            smallest pickleball community with the largest international stage.
          </p>

          <a href="#ecosystem" className="comp-hero-action">
            EXPLORE THE ECOSYSTEM ↓
          </a>
        </div>

        <div className="comp-hero-index">
          <span>COMMUNITY</span>
          <i />
          <span>WORLD</span>
        </div>
      </section>

      {/* 02 — INTRODUCTION */}
      <section className="comp-section comp-intro">
        <div className="section-shell">
          <p className="comp-kicker">
            <b>02</b> FROM FIRST GAME TO WORLD STAGE
          </p>

          <div className="comp-intro-grid">
            <h2>
              Every level
              <br />
              <em>matters.</em>
            </h2>

            <div>
              <strong>
                World-level competition only exists because people first find
                somewhere to play.
              </strong>

              <p>
                WPU&apos;s developing competition philosophy starts with the
                grassroots. Communities create players. Clubs create belonging.
                Domestic structures create pathways. International competition
                connects them.
              </p>

              <p>
                Different countries will require different structures. The
                objective is not to impose one rigid ladder, but to create a
                connected international ecosystem that can accommodate them.
              </p>

              <div className="comp-principle">
                <span>THE PRINCIPLE</span>
                <b>
                  DIFFERENT COUNTRIES. DIFFERENT STRUCTURES.
                  <br />
                  ONE CONNECTED SPORT.
                </b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — INTERACTIVE ECOSYSTEM */}
      <section className="comp-ecosystem" id="ecosystem">
        <div className="section-shell">
          <div className="comp-ecosystem-head">
            <div>
              <p className="comp-kicker light">
                <b>03</b> THE COMPETITION ECOSYSTEM
              </p>

              <h2>
                Start small.
                <br />
                <em>Go anywhere.</em>
              </h2>
            </div>

            <p>
              The levels describe scale, not a compulsory qualification route.
              National organisations can build structures appropriate to their
              own geography and sporting environment.
            </p>
          </div>

          <div className="comp-community-photo">
            <Image
              src="/images/wpu-competition-community.png"
              alt="Community pickleball players competing together"
              fill
              sizes="(max-width: 900px) 100vw, 1180px"
            />
            <div className="comp-community-overlay" />

            <div className="comp-community-caption">
              <span>WHERE IT STARTS</span>
              <strong>
                PEOPLE PLAY.
                <br />
                COMMUNITIES FORM.
              </strong>
            </div>
          </div>

          <CompetitionEcosystem />
        </div>
      </section>

      {/* 04 — TWO-WAY SYSTEM */}
      <section className="comp-section comp-two-way">
        <div className="section-shell">
          <p className="comp-kicker">
            <b>04</b> A TWO-WAY SYSTEM
          </p>

          <div className="comp-two-way-grid">
            <div>
              <h2>
                Opportunity
                <br />
                travels <em>up.</em>
              </h2>

              <div className="comp-flow upward">
                <span>PLAYER</span>
                <b>↑</b>
                <span>COMMUNITY</span>
                <b>↑</b>
                <span>CLUB</span>
                <b>↑</b>
                <span>NATIONAL</span>
                <b>↑</b>
                <span>WORLD</span>
              </div>
            </div>

            <div>
              <h2>
                Support flows
                <br />
                <em>back.</em>
              </h2>

              <div className="comp-flow downward">
                <span>WORLD</span>
                <b>↓</b>
                <span>STANDARDS</span>
                <b>↓</b>
                <span>OPPORTUNITY</span>
                <b>↓</b>
                <span>DEVELOPMENT</span>
                <b>↓</b>
                <span>PLAYER</span>
              </div>
            </div>
          </div>

          <div className="comp-two-way-statement">
            <strong>
              The world stage should strengthen the grassroots that made it
              possible.
            </strong>
          </div>
        </div>
      </section>

      {/* 05 — WAYS TO COMPETE */}
      <section className="comp-section comp-formats">
        <div className="section-shell">
          <p className="comp-kicker light">
            <b>05</b> WAYS TO COMPETE
          </p>

          <div className="comp-heading-row">
            <h2>
              Competition
              <br />
              has many <em>forms.</em>
            </h2>

            <p>
              Competition can exist throughout the ecosystem. Not every match
              needs to lead toward elite international play to have value.
            </p>
          </div>

          <div className="comp-format-grid">
            {formats.map(([number, title, text]) => (
              <article key={number}>
                <b>{number}</b>
                <h3>{title}</h3>
                <p>{text}</p>
                <span>→</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 06 — NATIONAL REPRESENTATION */}
      <section className="comp-section comp-national">
        <div className="section-shell">
          <p className="comp-kicker">
            <b>06</b> REPRESENTING YOUR COUNTRY
          </p>

          <div className="comp-national-photo">
            <Image
              src="/images/wpu-competition-national.png"
              alt="International pickleball athletes meeting at the net"
              fill
              sizes="(max-width: 900px) 100vw, 1180px"
            />
            <div className="comp-national-photo-shade" />

            <div className="comp-national-photo-caption">
              <span>BEYOND THE INDIVIDUAL</span>
              <strong>REPRESENT SOMETHING LARGER.</strong>
            </div>
          </div>

          <div className="comp-national-grid">
            <div>
              <h2>
                Beyond the
                <br />
                individual.
                <br />
                <em>Represent.</em>
              </h2>

              <p>
                One of the most meaningful transitions in sport is from
                competing as an individual to representing something larger.
              </p>
            </div>

            <NationalCompetitionPath />
          </div>

          <p className="comp-policy-note">
            Athlete eligibility and national representation requirements will
            be defined through formally adopted WPU competition regulations.
          </p>
        </div>
      </section>

      {/* 07 — CATEGORIES */}
      <section className="comp-section comp-categories">
        <div className="section-shell">
          <p className="comp-kicker">
            <b>07</b> COMPETITION CATEGORIES
          </p>

          <div className="comp-heading-row">
            <h2>
              More ways
              <br />
              to <em>compete.</em>
            </h2>

            <p>
              WPU intends to support competition structures capable of serving
              different formats, ages and levels of play.
            </p>
          </div>

          <div className="comp-category-grid">
            {categories.map(([title, text]) => (
              <article key={title}>
                <span className="comp-category-ball" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>

          <p className="comp-policy-note">
            Final competition categories and classifications remain subject to
            the WPU competition framework currently in development.
          </p>
        </div>
      </section>

      {/* 08 — CALENDAR */}
      <section className="comp-section comp-calendar">
        <div className="section-shell">
          <div className="comp-calendar-head">
            <div>
              <p className="comp-kicker light">
                <b>08</b> INTERNATIONAL CALENDAR
              </p>
              <h2>
                The world
                <br />
                will <em>play.</em>
              </h2>
            </div>

            <div className="comp-coming-soon">
              <span>STATUS</span>
              <strong>COMING SOON</strong>
            </div>
          </div>

          <div className="comp-event-board">
            <div className="comp-event-board-head">
              <span>DATE</span>
              <span>COMPETITION</span>
              <span>LEVEL</span>
              <span>LOCATION</span>
              <span>STATUS</span>
            </div>

            {[1, 2, 3].map((item) => (
              <div className="comp-event-placeholder" key={item}>
                <span>—</span>
                <strong>WPU EVENT TO BE ANNOUNCED</strong>
                <span>—</span>
                <span>—</span>
                <b>COMING SOON</b>
              </div>
            ))}
          </div>

          <p className="comp-calendar-note">
            Official WPU competitions will appear here once formally confirmed.
          </p>
        </div>
      </section>

      {/* 09 — RANKINGS */}
      <section className="comp-section comp-rankings">
        <div className="section-shell">
          <p className="comp-kicker">
            <b>09</b> WORLD RANKINGS
          </p>

          <div className="comp-rankings-grid">
            <div>
              <h2>
                Performance
                <br />
                should have
                <br />
                <em>context.</em>
              </h2>

              <p>
                WPU intends to develop an international ranking framework that
                can recognise competitive performance across appropriate
                sanctioned events and levels.
              </p>

              <div className="comp-status">
                <span>STATUS</span>
                <b>RANKING FRAMEWORK IN DEVELOPMENT</b>
              </div>
            </div>

            <CompetitionRankingBoard />
          </div>
        </div>
      </section>

      {/* 10 — STANDARDS */}
      <section className="comp-section comp-standards-link">
        <div className="section-shell">
          <p className="comp-kicker light">
            <b>10</b> RULES · OFFICIATING · STANDARDS
          </p>

          <div className="comp-standards-grid">
            <h2>
              Fair competition
              <br />
              needs a <em>framework.</em>
            </h2>

            <div>
              <p>
                Rules of play, equipment standards, officiating, event
                operations, athlete eligibility and competition integrity all
                contribute to credible international sport.
              </p>

              <Link href="/standards">
                EXPLORE WPU STANDARDS →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 11 — HOST */}
      <section className="comp-section comp-host">
        <div className="section-shell">
          <p className="comp-kicker">
            <b>11</b> HOST WITH WPU
          </p>

          <div className="comp-host-grid">
            <div>
              <h2>
                Bring
                <br />
                competition
                <br />
                <em>to your city.</em>
              </h2>

              <p>
                WPU welcomes early conversations with national organisations,
                cities, venues and event partners interested in future
                international competition.
              </p>
            </div>

            <div className="comp-host-cards">
              <article>
                <span>01</span>
                <strong>NATIONAL ORGANISATIONS</strong>
                <p>Explore future sanctioned and representative competition.</p>
              </article>
              <article>
                <span>02</span>
                <strong>CITIES &amp; DESTINATIONS</strong>
                <p>Explore the potential of international pickleball events.</p>
              </article>
              <article>
                <span>03</span>
                <strong>VENUES &amp; EVENT PARTNERS</strong>
                <p>Discuss facilities, operations and event collaboration.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* 12 — INTEREST */}
      <section className="comp-interest" id="competition-interest">
        <div className="section-shell comp-interest-grid">
          <div>
            <p className="comp-kicker">
              <b>12</b> COMPETITION INTEREST
            </p>

            <h2>
              Start the
              <br />
              <em>conversation.</em>
            </h2>

            <p>
              Tell WPU about your organisation, destination, venue or proposed
              competition.
            </p>
          </div>

          <form className="comp-form">
            <div className="comp-form-row">
              <label>
                ORGANISATION *
                <input name="organisation" required placeholder="Organisation name" />
              </label>

              <label>
                COUNTRY / TERRITORY *
                <input name="country" required placeholder="Country or territory" />
              </label>
            </div>

            <div className="comp-form-row">
              <label>
                CONTACT PERSON *
                <input name="name" required placeholder="Full name" />
              </label>

              <label>
                EMAIL *
                <input type="email" name="email" required placeholder="Email address" />
              </label>
            </div>

            <div className="comp-form-row">
              <label>
                AREA OF INTEREST
                <select name="interest" defaultValue="">
                  <option value="" disabled>Select one</option>
                  <option>National competition</option>
                  <option>International competition</option>
                  <option>Host city / destination</option>
                  <option>Venue</option>
                  <option>Event partnership</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                APPROXIMATE DATE
                <input type="text" name="date" placeholder="If known" />
              </label>
            </div>

            <label>
              TELL US ABOUT THE OPPORTUNITY
              <textarea
                name="message"
                rows={6}
                placeholder="A short introduction to your proposal..."
              />
            </label>

            <label className="comp-consent">
              <input type="checkbox" required />
              <span>
                I agree that WPU may use these details to contact me regarding
                competition development.
              </span>
            </label>

            <button type="submit">SUBMIT INTEREST →</button>

            <small>
              Submission of interest does not constitute sanctioning,
              endorsement or confirmation of a WPU event.
            </small>
          </form>
        </div>
      </section>

      <section className="final-cta comp-final">
        <div className="section-shell final-inner">
          <p>WORLD PICKLEBALL UNION</p>

          <h2>
            Start somewhere.
            <br />
            Go <em>anywhere.</em>
          </h2>

          <div className="about-final-action">
            <a href="#ecosystem">EXPLORE THE PATHWAY ↑</a>
            <p>COMMUNITY · CLUB · NATION · WORLD</p>
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
