"use client";

import { useState } from "react";

interface Props {
  mediaUrl: string | null;
  rows: number;
  cols: number;
  onSubmit: (answer: Record<string, unknown>) => void;
  disabled: boolean;
}

const TILE_PX = 100; // visina/širina jedne pločice u pikselima

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

    // Zamijeni pločice
    const newTiles = [...tiles];
    const tmp = newTiles[selectedPos]!;
    newTiles[selectedPos] = newTiles[pos]!;
    newTiles[pos] = tmp;
    setTiles(newTiles);
    setSelectedPos(null);

    // Provjeri je li slagalica riješena
    if (newTiles.every((id, i) => id === i)) {
      onSubmit({ solved: true });
    }
  }

  if (!mediaUrl) {
    return (
      <div className="rounded-xl border border-white/20 p-6 text-center text-sm text-white/50">
        Slika nije dostupna za ovu slagalicu.
        <br />
        <button
          onClick={() => onSubmit({ solved: false })}
          disabled={disabled}
          className="mt-3 rounded-full bg-white/10 px-6 py-2 text-sm transition hover:bg-white/20 disabled:opacity-40"
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
      <p className="text-sm text-white/60">
        Klikni pločicu pa klikni na ciljnu poziciju da ih zamijeniš
      </p>

      {/* Grid slagalice */}
      <div
        className="overflow-hidden rounded-xl border-2 border-white/20"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${TILE_PX}px)`,
          gridTemplateRows: `repeat(${rows}, ${TILE_PX}px)`,
          width: `${totalW}px`,
          height: `${totalH}px`,
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
              className={`relative cursor-pointer select-none border transition-all duration-150 ${
                isSelected
                  ? "border-[hsl(280,100%,70%)] brightness-125 z-10"
                  : isSolved
                    ? "border-green-500/40"
                    : "border-white/10 hover:border-white/30"
              }`}
              style={{
                width: `${TILE_PX}px`,
                height: `${TILE_PX}px`,
                backgroundImage: `url(${mediaUrl})`,
                backgroundSize: `${totalW}px ${totalH}px`,
                backgroundPosition: `-${tileCol * TILE_PX}px -${tileRow * TILE_PX}px`,
                backgroundRepeat: "no-repeat",
              }}
            >
              {/* Overlay za odabranu pločicu */}
              {isSelected && (
                <div className="absolute inset-0 bg-[hsl(280,100%,70%)]/30" />
              )}
              {/* Zeleni tint kad je na ispravnoj poziciji */}
              {isCorrect && !isSelected && (
                <div className="absolute inset-0 bg-green-500/10" />
              )}
              {/* Mali broj pločice (debug aid) */}
              <span className="absolute bottom-0.5 right-1 text-[9px] text-white/30 select-none">
                {tileId + 1}
              </span>
            </div>
          );
        })}
      </div>

      {isSolved && (
        <p className="text-sm font-semibold text-green-400">✓ Slagalica riješena!</p>
      )}

      {/* Pregled rješenja minijatura */}
      <details className="text-center">
        <summary className="cursor-pointer text-xs text-white/30 hover:text-white/50">
          Pogledaj cijelu sliku
        </summary>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl}
          alt="Cijela slika"
          className="mt-2 max-h-32 rounded-lg object-contain opacity-50"
        />
      </details>
    </div>
  );
}
