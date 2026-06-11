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
      <p className="text-sm" style={{ color: "var(--text-mut)" }}>
        Klikni na razlike između dvije slike · Oznake su prikazane na obje slike
      </p>

      <div className="grid grid-cols-2 gap-3">
        {images.map(({ label, url, ref }) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: "var(--text-mut)" }}>{label}</span>
            <div
              className="relative cursor-crosshair overflow-hidden rounded-[var(--r-md)]"
              onClick={(e) => handleImageClick(e, ref)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={ref}
                src={url ?? ""}
                alt={label}
                className="w-full select-none rounded-[var(--r-md)]"
                draggable={false}
              />
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
                  <div
                    className="h-6 w-6 rounded-full border-2"
                    style={{ borderColor: "var(--cream)", background: "rgba(230,57,70,0.7)" }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {markers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {markers.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => !disabled && removeMarker(m.id)}
              disabled={disabled}
              className="flex items-center gap-1 rounded-full px-3 py-1 text-xs transition disabled:cursor-default"
              style={{ background: "var(--glass-strong)", border: "1px solid var(--border-soft)", color: "var(--cream)" }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(230,57,70,0.2)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "var(--glass-strong)")}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--red)" }} />
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
        className="btn-primary w-full py-3"
      >
        Potvrdi ({markers.length} razlik{markers.length === 1 ? "a" : "e"} označeno)
      </button>
    </div>
  );
}
