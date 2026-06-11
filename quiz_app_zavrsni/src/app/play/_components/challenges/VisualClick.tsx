"use client";

import { useRef, useState } from "react";

interface Props {
  mediaUrl: string | null;
  onSubmit: (answer: Record<string, unknown>) => void;
  disabled: boolean;
}

export default function VisualClick({ mediaUrl, onSubmit, disabled }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [clicked, setClicked] = useState<{ x: number; y: number } | null>(null);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (disabled || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setClicked({ x, y });
  }

  if (!mediaUrl) {
    return <p className="text-sm" style={{ color: "var(--text-mut)" }}>Slika nije dostupna za ovaj izazov.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: "var(--text-mut)" }}>Klikni na traženo mjesto na slici</p>

      {/* Klikabilna slika s markerom */}
      <div
        className="relative cursor-crosshair overflow-hidden rounded-[var(--r-md)]"
        onClick={handleClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={mediaUrl}
          alt="Klikni na sliku"
          className="w-full select-none rounded-[var(--r-md)]"
          draggable={false}
        />
        {clicked && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${clicked.x * 100}%`,
              top: `${clicked.y * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Vanjski prsten */}
            <div className="h-8 w-8 rounded-full border-2 bg-transparent" style={{ borderColor: "rgba(230,57,70,0.7)" }} />
            {/* Unutarnji punkt */}
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "var(--red)", transform: "translate(-50%, -50%)" }} />
          </div>
        )}
      </div>

      <button
        onClick={() => clicked && onSubmit({ x: clicked.x, y: clicked.y })}
        disabled={disabled || !clicked}
        className="btn-primary w-full py-3"
      >
        {clicked ? "Potvrdi odabir" : "Klikni na sliku"}
      </button>
    </div>
  );
}
