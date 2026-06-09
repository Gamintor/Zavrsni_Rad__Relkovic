"use client";

import { useRef, useState } from "react";

interface Marker {
  id: number;
  x: number;
  y: number;
}

interface Props {
  mediaUrl: string | null;  // slika A
  imageB: string;            // slika B
  onSubmit: (answer: Record<string, unknown>) => void;
  disabled: boolean;
}

let nextMarkerId = 0;

export default function SpotDifference({
  mediaUrl,
  imageB,
  onSubmit,
  disabled,
}: Props) {
  const [markers, setMarkers] = useState<Marker[]>([]);

  function handleImageClick(
    e: React.MouseEvent<HTMLDivElement>,
    imgRef: React.RefObject<HTMLImageElement | null>,
  ) {
    if (disabled || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setMarkers((prev) => [...prev, { id: nextMarkerId++, x, y }]);
  }

  function removeMarker(id: number) {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  }

  const imgARef = useRef<HTMLImageElement>(null);
  const imgBRef = useRef<HTMLImageElement>(null);

  const images = [
    { label: "Slika A", url: mediaUrl, ref: imgARef },
    { label: "Slika B", url: imageB, ref: imgBRef },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/60">
        Klikni na razlike između dvije slike · Oznake su prikazane na obje slike
      </p>

      <div className="grid grid-cols-2 gap-3">
        {images.map(({ label, url, ref }) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-xs text-white/40">{label}</span>
            <div
              className="relative cursor-crosshair overflow-hidden rounded-lg"
              onClick={(e) => handleImageClick(e, ref)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={ref}
                src={url ?? ""}
                alt={label}
                className="w-full select-none rounded-lg"
                draggable={false}
              />
              {/* Oznake na slici — iste koordinate na obje slike */}
              {markers.map((m) => (
                <div
                  key={m.id}
                  className="pointer-events-none absolute"
                  style={{
                    left: `${m.x * 100}%`,
                    top: `${m.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="h-6 w-6 rounded-full border-2 border-white bg-[hsl(280,100%,70%)]/80" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lista oznaka s mogućnošću brisanja */}
      {markers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {markers.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => !disabled && removeMarker(m.id)}
              disabled={disabled}
              className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs transition hover:bg-red-500/30 disabled:cursor-default"
            >
              <span className="h-2 w-2 rounded-full bg-[hsl(280,100%,70%)]" />
              Razlika {i + 1} ✕
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() =>
          onSubmit({ found: markers.map(({ x, y }) => ({ x, y })) })
        }
        disabled={disabled}
        className="rounded-full bg-[hsl(280,100%,70%)] py-2.5 font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
      >
        Potvrdi ({markers.length} razlik{markers.length === 1 ? "a" : "e"} označeno)
      </button>
    </div>
  );
}
