"use client";

import { useEffect, useRef, useState } from "react";

interface TimerProps {
  timeLimitSec: number;
  onExpire: () => void;
  paused?: boolean;
}

// Remountan s key={challenge.id} da se timer resetira za svaki novi izazov
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
  const color =
    ratio > 0.5 ? "text-green-400" : ratio > 0.25 ? "text-yellow-400" : "text-red-400";
  const barColor =
    ratio > 0.5 ? "bg-green-400" : ratio > 0.25 ? "bg-yellow-400" : "bg-red-400";

  return (
    <div className="flex items-center gap-3">
      <span className={`w-12 text-right text-xl font-bold tabular-nums ${color}`}>
        {remaining}s
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
