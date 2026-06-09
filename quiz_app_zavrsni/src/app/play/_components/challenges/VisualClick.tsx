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
    return <p className="text-sm text-white/50">Slika nije dostupna za ovaj izazov.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/60">Klikni na traženo mjesto na slici</p>

      {/* Klikabilna slika s markerom */}
      <div
        className="relative cursor-crosshair overflow-hidden rounded-xl"
        onClick={handleClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={mediaUrl}
          alt="Klikni na sliku"
          className="w-full select-none rounded-xl"
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
            <div className="h-8 w-8 rounded-full border-2 border-white/60 bg-transparent" />
            {/* Unutarnji punkt */}
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(280,100%,70%)]" style={{ transform: "translate(-50%, -50%)" }} />
          </div>
        )}
      </div>

      <button
        onClick={() => clicked && onSubmit({ x: clicked.x, y: clicked.y })}
        disabled={disabled || !clicked}
        className="rounded-full bg-[hsl(280,100%,70%)] py-2.5 font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
      >
        {clicked ? "Potvrdi odabir" : "Klikni na sliku"}
      </button>
    </div>
  );
}
