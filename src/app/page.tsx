const pillars = [
  ["Governance", "Rules, integrity, representation and accountable international governance."],
  ["Competition", "International competition, championships, rankings and athlete pathways."],
  ["Development", "Supporting national bodies, coaches, officials, youth and emerging nations."],
  ["Standards", "Clear technical standards for the sport and competition equipment."],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <header className="header shell">
          <a href="#" className="brand">
            <div className="mark">
              <strong>WPU</strong>
              <span>●</span>
            </div>
            <div className="brandText">
              <strong>WORLD PICKLEBALL UNION</strong>
              <small>UNITING PICKLEBALL WORLDWIDE</small>
            </div>
          </a>

          <nav>
            <a href="#about">About</a>
            <a href="#governance">Governance</a>
            <a href="#members">Members</a>
            <a href="#competition">Competitions</a>
            <a href="#standards">Standards</a>
            <a href="#development">Development</a>
          </nav>

          <a href="#members" className="join">Join WPU</a>
        </header>

        <div className="heroContent shell">
          <div>
            <p className="eyebrow lime">WORLD PICKLEBALL UNION</p>

            <h1>
              Uniting
              <br />
              pickleball
              <br />
              worldwide.
            </h1>

            <p className="intro">
              World Pickleball Union is an international non-profit
              governing body created to govern, develop and advance
              pickleball through global cooperation, competition,
              standards and integrity.
            </p>

            <div className="actions">
              <a href="#about" className="primary">
                Explore WPU →
              </a>

              <a href="#members" className="secondary">
                Membership
              </a>
            </div>
          </div>

          <div className="worldGraphic">
            <div className="orbit orbitOne" />
            <div className="orbit orbitTwo" />

            <div className="globe">
              <div className="latitude one" />
              <div className="latitude two" />
              <div className="longitude one" />
              <div className="longitude two" />

              <div className="ball">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>

            <div className="globalLabel">
              <span>GLOBAL FRAMEWORK</span>
              <strong>
                Governance. Competition.
                <br />
                Development. Standards.
              </strong>
            </div>
          </div>
        </div>

        <div className="principles">
          <div className="shell principleGrid">
            <div>
              <span>01</span>
              <strong>Independent</strong>
              <p>Standalone international governing body</p>
            </div>

            <div>
              <span>02</span>
              <strong>Non-profit</strong>
              <p>Resources reinvested into the sport</p>
            </div>

            <div>
              <span>03</span>
              <strong>Global</strong>
              <p>Built to serve pickleball worldwide</p>
            </div>

            <div>
              <span>04</span>
              <strong>Transparent</strong>
              <p>Clear governance, rules and standards</p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="section cream">
        <div className="shell split">
          <div>
            <p className="eyebrow">ABOUT WPU</p>

            <h2>
              A world body built for the long-term development of pickleball.
            </h2>
          </div>

          <div className="copy">
            <p>
              World Pickleball Union is being established as a standalone
              international non-profit sports governing body.
            </p>

            <p>
              Its purpose is to bring national organizations together,
              establish common sporting frameworks and help pickleball grow
              internationally with credibility, integrity and transparency.
            </p>

            <p>
              WPU exists for the sport. Revenue generated through membership,
              competition, certification, education, licensing and commercial
              partnerships is intended to support its sporting objectives and
              continued global development.
            </p>
          </div>
        </div>
      </section>

      <section className="section white">
        <div className="shell">
          <div className="sectionIntro">
            <div>
              <p className="eyebrow">WHAT WPU DOES</p>
              <h2>One international framework.</h2>
            </div>

            <p>
              Equipment certification is one responsibility of WPU. The
              institution itself exists to govern and develop the whole sport.
            </p>
          </div>

          <div className="pillarGrid">
            {pillars.map(([title, text], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <b>→</b>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="governance" className="section navy">
        <div className="shell split">
          <div>
            <p className="eyebrow lime">GOVERNANCE</p>

            <h2>Credibility starts with the institution.</h2>
          </div>

          <div className="governance">
            <div>
              <i />
              <section>
                <strong>General Assembly</strong>
                <p>Representation and voting by WPU members.</p>
              </section>
            </div>

            <div>
              <i />
              <section>
                <strong>Executive Leadership</strong>
                <p>Accountable management of the Union&apos;s affairs.</p>
              </section>
            </div>

            <div>
              <i />
              <section>
                <strong>Technical Commissions</strong>
                <p>
                  Rules, competition, equipment, officiating and development.
                </p>
              </section>
            </div>

            <div>
              <i />
              <section>
                <strong>Integrity & Appeals</strong>
                <p>Fair and transparent institutional processes.</p>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section id="members" className="section cream">
        <div className="shell memberSection">
          <div className="memberGlobe">
            <div className="memberCircle">
              <i className="point p1" />
              <i className="point p2" />
              <i className="point p3" />
              <i className="point p4" />
              <i className="point p5" />
            </div>
          </div>

          <div>
            <p className="eyebrow">MEMBER NATIONS</p>

            <h2>
              National bodies are the foundation of a world federation.
            </h2>

            <p className="largeText">
              WPU membership will bring national pickleball organizations
              together through a common international framework while
              respecting the development of the sport within each country.
            </p>

            <a className="darkButton" href="#updates">
              Membership framework →
            </a>
          </div>
        </div>
      </section>

      <section id="competition" className="section white">
        <div className="shell">
          <div className="sectionIntro">
            <div>
              <p className="eyebrow">COMPETITION</p>

              <h2>
                From national competition to international representation.
              </h2>
            </div>

            <p>
              WPU will develop international competition structures together
              with its members under published sporting regulations.
            </p>
          </div>

          <div className="pathway">
            <article>
              <span>01</span>
              <strong>National</strong>
              <p>Domestic competition and athlete pathways.</p>
            </article>

            <article>
              <span>02</span>
              <strong>Continental</strong>
              <p>Regional competition connecting national systems.</p>
            </article>

            <article>
              <span>03</span>
              <strong>World</strong>
              <p>International representation under WPU frameworks.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="standards" className="section standards">
        <div className="shell standardsGrid">
          <div>
            <p className="eyebrow lime">TECHNICAL STANDARDS</p>

            <h2>
              Clear standards.
              <br />
              Trusted equipment.
            </h2>

            <p className="standardsCopy">
              WPU intends to establish transparent technical standards for
              competition equipment and maintain a public register of approved
              products.
            </p>
          </div>

          <div className="certificate">
            <div className="badge">
              <small>WORLD PICKLEBALL UNION</small>
              <strong>WPU</strong>
              <b>APPROVED</b>
              <span>COMPETITION EQUIPMENT</span>
            </div>

            <div>
              <p className="eyebrow">APPROVED EQUIPMENT</p>

              <h3>Public certification registry</h3>

              <p>
                Approved products will eventually carry a verifiable
                certification record containing manufacturer, model, standard,
                status and certification number.
              </p>

              <div className="record">
                <span>Example ID</span>
                <strong>WPU-PA-000001</strong>
              </div>

              <div className="record">
                <span>Registry</span>
                <strong>Launching later</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="development" className="section cream">
        <div className="shell">
          <div className="sectionIntro">
            <div>
              <p className="eyebrow">DEVELOPMENT</p>

              <h2>Develop the whole ecosystem.</h2>
            </div>

            <p>
              Sustainable global growth requires athletes, coaches, officials,
              national organizations, youth pathways and developing pickleball
              nations.
            </p>
          </div>

          <div className="developmentGrid">
            <div>Athletes</div>
            <div>Coaches</div>
            <div>Officials</div>
            <div>Youth</div>
            <div>National Bodies</div>
            <div>Emerging Nations</div>
          </div>
        </div>
      </section>

      <section id="updates" className="section white">
        <div className="shell">
          <div className="sectionIntro">
            <div>
              <p className="eyebrow">BUILDING WPU</p>
              <h2>Building the institution in public.</h2>
            </div>

            <p>
              WPU should clearly distinguish between what exists today and what
              is still being developed.
            </p>
          </div>

          <div className="updates">
            <article>
              <span>IN DEVELOPMENT</span>
              <h3>Founding Framework</h3>
              <p>
                Governance, membership and institutional structures are being
                developed for the Union.
              </p>
            </article>

            <article>
              <span>COMING SOON</span>
              <h3>Membership</h3>
              <p>
                A transparent application framework for national pickleball
                organizations.
              </p>
            </article>

            <article>
              <span>COMING SOON</span>
              <h3>Equipment Standards</h3>
              <p>
                Technical specifications, testing procedures and certification
                requirements.
              </p>
            </article>
          </div>
        </div>
      </section>

      <footer>
        <div className="shell footerGrid">
          <div>
            <div className="footerWpu">WPU</div>
            <strong>WORLD PICKLEBALL UNION</strong>
            <small>UNITING PICKLEBALL WORLDWIDE</small>
          </div>

          <div>
            <strong>Institution</strong>
            <a href="#about">About WPU</a>
            <a href="#governance">Governance</a>
            <a href="#members">Membership</a>
          </div>

          <div>
            <strong>Sport</strong>
            <a href="#competition">Competition</a>
            <a href="#standards">Standards</a>
            <a href="#development">Development</a>
          </div>

          <div>
            <strong>World Pickleball Union</strong>
            <span>worldpickleball.world</span>
          </div>
        </div>

        <div className="shell copyright">
          <span>© 2026 World Pickleball Union</span>
          <span>International non-profit sports governing body</span>
        </div>
      </footer>
    </main>
  );
}
