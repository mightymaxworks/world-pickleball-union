"use client";

import { useEffect, useRef, useState } from "react";

export default function CompetitionRankingBoard() {
  const ref = useRef<HTMLDivElement>(null);
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let timers: ReturnType<typeof setTimeout>[] = [];

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        for (let i = 1; i <= 5; i++) {
          timers.push(
            setTimeout(() => {
              setVisibleRows(i);
            }, 180 + i * 130)
          );
        }

        observer.disconnect();
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={ref} className="comp-ranking-board comp-ranking-board-live">
      <div className="comp-ranking-title">
        <span>WPU</span>

        <div>
          <strong>WORLD RANKINGS</strong>
          <small>FRAMEWORK IN DEVELOPMENT</small>
        </div>
      </div>

      <div className="ranking-column-head">
        <span>RANK</span>
        <span>PLAYER</span>
        <span>PERFORMANCE</span>
        <span>PTS</span>
      </div>

      {[1, 2, 3, 4, 5].map((rank, index) => (
        <div
          className={`comp-ranking-row ${
            visibleRows > index ? "is-visible" : ""
          }`}
          key={rank}
        >
          <b>{String(rank).padStart(2, "0")}</b>

          <span className="ranking-player">
            <i />
            PLAYER
          </span>

          <div className="ranking-performance">
            <i />
          </div>

          <small>—</small>
        </div>
      ))}

      <div
        className={`ranking-board-status ${
          visibleRows === 5 ? "is-visible" : ""
        }`}
      >
        <i />
        <span>AWAITING OFFICIAL COMPETITION DATA</span>
      </div>
    </div>
  );
}
