"use client";

import { useEffect, useRef, useState } from "react";

interface TimerProps {
  timeLimitSec: number;
  onExpire: () => void;
  paused?: boolean;
}

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Timer({ timeLimitSec, onExpire, paused = false }: TimerProps) {
  const [remaining, setRemaining] = useState(timeLimitSec);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    setRemaining(timeLimitSec);
    if (paused) return;

    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          if (!firedRef.current) {
            firedRef.current = true;
            onExpire();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLimitSec, paused]);

  const ratio = remaining / timeLimitSec;
  const isLow = remaining <= 5;
  const strokeColor = isLow ? "var(--red)" : "var(--powder)";
  const dashOffset = CIRCUMFERENCE * (1 - ratio);

  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      aria-label={`Preostalo ${remaining} sekundi`}
      className="shrink-0"
    >
      {/* Track */}
      <circle
        cx="24" cy="24" r={RADIUS}
        fill="none"
        stroke="rgba(168,218,220,0.15)"
        strokeWidth="4"
      />
      {/* Progress */}
      <circle
        cx="24" cy="24" r={RADIUS}
        fill="none"
        stroke={strokeColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 24 24)"
        style={{ transition: "stroke-dashoffset 0.95s linear, stroke 0.3s" }}
      />
      {/* Broj */}
      <text
        x="24" y="25"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={isLow ? "var(--red)" : "var(--cream)"}
        fontSize="13"
        fontWeight="800"
        fontFamily="inherit"
        style={{ transition: "fill 0.3s" }}
      >
        {remaining}
      </text>
    </svg>
  );
}
