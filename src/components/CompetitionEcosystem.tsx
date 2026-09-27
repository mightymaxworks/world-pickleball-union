"use client";

import { useEffect, useRef, useState } from "react";

const ecosystem = [
  {
    number: "01",
    title: "COMMUNITY",
    short: "Where it begins.",
    text: "Schools, workplaces, facilities, neighbourhoods and grassroots groups create the first opportunities to play and compete.",
  },
  {
    number: "02",
    title: "CLUB",
    short: "Where players belong.",
    text: "Regular play, training, ladders, leagues and teams create a lasting competitive home.",
  },
  {
    number: "03",
    title: "LOCAL / CITY",
    short: "Where communities connect.",
    text: "Clubs and groups compete across cities, municipalities, districts and other local structures.",
  },
  {
    number: "04",
    title: "SUB-NATIONAL",
    short: "Where pathways expand.",
    text: "State, province, prefecture, county, territory or other structures appropriate to each country.",
  },
  {
    number: "05",
    title: "NATIONAL",
    short: "Where a country comes together.",
    text: "National competition, championships and pathways toward representing a country.",
  },
  {
    number: "06",
    title: "INTERNATIONAL REGION",
    short: "Where nations meet.",
    text: "Neighbouring countries connect through appropriate international geographic groupings.",
  },
  {
    number: "07",
    title: "CONTINENTAL",
    short: "Where regions converge.",
    text: "Broader international competition across continental structures adopted by WPU.",
  },
  {
    number: "08",
    title: "WORLD",
    short: "The global stage.",
    text: "The highest level of future WPU international competition and representation.",
  },
];

export default function CompetitionEcosystem() {
  const journeyRef = useRef<HTMLDivElement>(null);
  const levelRefs = useRef<(HTMLElement | null)[]>([]);

  const [progress, setProgress] = useState(0);
  const [activeLevel, setActiveLevel] = useState(-1);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;

      const journey = journeyRef.current;
      if (!journey) return;

      const journeyRect = journey.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      /*
       * The "playhead" sits around 58% down the viewport.
       * A level activates as it approaches this line.
       */
      const playhead = viewportHeight * 0.58;

      const levelCenters = levelRefs.current
        .map((el) => {
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          return rect.top + rect.height / 2;
        })
        .filter((v): v is number => v !== null);

      if (!levelCenters.length) return;

      /*
       * Determine active level based on actual DOM position,
       * not an estimated percentage.
       *
       * Small lead makes the level illuminate just before
       * the ball visually reaches its centre.
       */
      const activationLead = 70;

      let nextActive = -1;

      levelCenters.forEach((center, index) => {
        if (center <= playhead + activationLead) {
          nextActive = index;
        }
      });

      setActiveLevel(nextActive);

      /*
       * Ball progress is calculated between the first and
       * final level centres relative to the viewport playhead.
       */
      const firstCenter =
        levelCenters[0] - journeyRect.top;

      const lastCenter =
        levelCenters[levelCenters.length - 1] - journeyRect.top;

      const playheadInsideJourney =
        playhead - journeyRect.top;

      const raw =
        (playheadInsideJourney - firstCenter) /
        Math.max(1, lastCenter - firstCenter);

      setProgress(Math.max(0, Math.min(1, raw)));
    };

    const requestUpdate = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <div
      ref={journeyRef}
      className="comp-journey comp-journey-interactive"
    >
      {/* PLAY */}
      <div className={`comp-play-origin ${activeLevel >= -1 ? "is-active" : ""}`}>
        <div className="comp-play-ball">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>

        <div className="comp-play-copy">
          <span>THE BEGINNING</span>
          <strong>PLAY</strong>
          <small>One paddle. One ball. One place to begin.</small>
        </div>
      </div>

      {/* TRACK */}
      <div className="comp-journey-track" aria-hidden="true">
        <div className="comp-journey-track-base" />

        <div
          className="comp-journey-track-progress"
          style={{ height: `${progress * 100}%` }}
        />

        <div
          className="comp-moving-ball"
          style={{ top: `${progress * 100}%` }}
        >
          <span className="comp-ball-hole hole-1" />
          <span className="comp-ball-hole hole-2" />
          <span className="comp-ball-hole hole-3" />
          <span className="comp-ball-hole hole-4" />
          <span className="comp-ball-hole hole-5" />
        </div>
      </div>

      {/* LEVELS */}
      <div className="comp-levels">
        {ecosystem.map((level, index) => {
          const active = index <= activeLevel;
          const current = index === activeLevel;

          return (
            <article
              ref={(el) => {
                levelRefs.current[index] = el;
              }}
              className={[
                "comp-level",
                active ? "is-active" : "",
                current ? "is-current" : "",
                level.number === "08" ? "is-world" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={level.number}
            >
              <div className="comp-level-number">{level.number}</div>

              <div className="comp-level-main">
                <span>{level.short}</span>
                <h3>{level.title}</h3>
                <p>{level.text}</p>
              </div>

              <div className="comp-level-network" aria-hidden="true">
                {Array.from({ length: index + 2 }).map((_, dot) => (
                  <i
                    key={dot}
                    style={{
                      transitionDelay: active
                        ? `${dot * 35}ms`
                        : "0ms",
                    }}
                  />
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {/* WORLD */}
      <div
        className={`comp-world-arrival ${
          activeLevel >= ecosystem.length - 1 ? "is-active" : ""
        }`}
      >
        <div className="comp-world-rings" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>

        <span>08 / WORLD</span>

        <h2>
          MANY PATHWAYS.
          <br />
          <em>ONE WORLD STAGE.</em>
        </h2>

        <p>UNITING PICKLEBALL WORLDWIDE.</p>
      </div>
    </div>
  );
}
