"use client";

import { useEffect, useRef, useState } from "react";

const stages = [
  ["01", "COMPETE", "Domestic competition"],
  ["02", "PROGRESS", "National pathway"],
  ["03", "REPRESENT", "Your country"],
  ["04", "CONNECT", "International competition"],
];

export default function NationalCompetitionPath() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let timers: ReturnType<typeof setTimeout>[] = [];

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        timers.forEach(clearTimeout);
        timers = [];

        stages.forEach((_, index) => {
          timers.push(
            setTimeout(() => setActive(index), 250 + index * 360)
          );
        });

        observer.disconnect();
      },
      { threshold: 0.25 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={ref} className="national-relay">
      <div className="national-relay-line">
        <div
          className="national-relay-fill"
          style={{
            width:
              active < 0
                ? "0%"
                : `${(active / (stages.length - 1)) * 100}%`,
          }}
        />
      </div>

      {stages.map(([number, verb, description], index) => (
        <div
          key={number}
          className={`national-relay-stage ${
            index <= active ? "is-active" : ""
          } ${index === active ? "is-current" : ""}`}
        >
          <div className="national-relay-node">
            <span>{number}</span>
          </div>

          <strong>{verb}</strong>
          <p>{description}</p>
        </div>
      ))}
    </div>
  );
}
