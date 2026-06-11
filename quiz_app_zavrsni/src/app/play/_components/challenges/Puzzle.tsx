"use client";

import { useState } from "react";

interface Props {
  mediaUrl: string | null;
  rows: number;
  cols: number;
  onSubmit: (answer: Record<string, unknown>) => void;
  disabled: boolean;
}

const TILE_PX = 100;

function shuffle(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

function ensureShuffled(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  let result = shuffle(arr);
  let attempts = 0;
  while (result.every((v, i) => v === i) && attempts < 20) {
    result = shuffle(arr);
    attempts++;
  }
  return result;
}

export default function Puzzle({ mediaUrl, rows, cols, onSubmit, disabled }: Props) {
  const n = rows * cols;

  const [tiles, setTiles] = useState<number[]>(() =>
    ensureShuffled(Array.from({ length: n }, (_, i) => i)),
  );
  const [selectedPos, setSelectedPos] = useState<number | null>(null);

  function handleTileClick(pos: number) {
    if (disabled) return;

    if (selectedPos === null) {
      setSelectedPos(pos);
      return;
    }
    if (selectedPos === pos) {
      setSelectedPos(null);
      return;
    }

    const newTiles = [...tiles];
    const tmp = newTiles[selectedPos]!;
    newTiles[selectedPos] = newTiles[pos]!;
    newTiles[pos] = tmp;
    setTiles(newTiles);
    setSelectedPos(null);

    if (newTiles.every((id, i) => id === i)) {
      onSubmit({ solved: true });
    }
  }

  if (!mediaUrl) {
    return (
      <div className="rounded-[var(--r-md)] p-6 text-center text-sm" style={{ border: "1px solid var(--border-soft)", color: "var(--text-mut)" }}>
        Slika nije dostupna za ovu slagalicu.
        <br />
        <button
          onClick={() => onSubmit({ solved: false })}
          disabled={disabled}
          className="btn-secondary mt-3 px-6 py-2 text-sm"
        >
          Preskoči
        </button>
      </div>
    );
  }

  const isSolved = tiles.every((id, i) => id === i);
  const totalW = cols * TILE_PX;
  const totalH = rows * TILE_PX;

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm" style={{ color: "var(--text-mut)" }}>
        Klikni pločicu pa klikni na ciljnu poziciju da ih zamijeniš
      </p>

      <div
        className="overflow-hidden rounded-[var(--r-md)]"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${TILE_PX}px)`,
          gridTemplateRows: `repeat(${rows}, ${TILE_PX}px)`,
          width: `${totalW}px`,
          height: `${totalH}px`,
          border: `2px solid ${isSolved ? "var(--green)" : "var(--border-soft)"}`,
          transition: "border-color 0.3s",
        }}
      >
        {tiles.map((tileId, pos) => {
          const tileRow = Math.floor(tileId / cols);
          const tileCol = tileId % cols;
          const isSelected = selectedPos === pos;
          const isCorrect = tileId === pos;

          return (
            <div
              key={pos}
              onClick={() => handleTileClick(pos)}
              title={`Pločica ${tileId + 1} na poziciji ${pos + 1}`}
              className="relative cursor-pointer select-none transition-all duration-150"
              style={{
                width: `${TILE_PX}px`,
                height: `${TILE_PX}px`,
                backgroundImage: `url(${mediaUrl})`,
                backgroundSize: `${totalW}px ${totalH}px`,
                backgroundPosition: `-${tileCol * TILE_PX}px -${tileRow * TILE_PX}px`,
                backgroundRepeat: "no-repeat",
                outline: isSelected
                  ? "2px solid var(--red)"
                  : isSolved
                    ? "1px solid rgba(42,157,143,0.4)"
                    : "1px solid rgba(241,250,238,0.08)",
                zIndex: isSelected ? 10 : "auto",
                filter: isSelected ? "brightness(1.25)" : "none",
              }}
            >
              {isSelected && (
                <div className="absolute inset-0" style={{ background: "rgba(230,57,70,0.25)" }} />
              )}
              {isCorrect && !isSelected && (
                <div className="absolute inset-0" style={{ background: "rgba(42,157,143,0.1)" }} />
              )}
              <span className="absolute bottom-0.5 right-1 select-none text-[9px]" style={{ color: "rgba(241,250,238,0.25)" }}>
                {tileId + 1}
              </span>
            </div>
          );
        })}
      </div>

      {isSolved && (
        <p className="text-sm font-semibold" style={{ color: "var(--green)" }}>✓ Slagalica riješena!</p>
      )}

      <details className="text-center">
        <summary className="cursor-pointer text-xs transition" style={{ color: "var(--text-mut)" }}>
          Pogledaj cijelu sliku
        </summary>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl}
          alt="Cijela slika"
          className="mt-2 max-h-32 rounded-[var(--r-md)] object-contain opacity-50"
        />
      </details>
    </div>
  );
}
