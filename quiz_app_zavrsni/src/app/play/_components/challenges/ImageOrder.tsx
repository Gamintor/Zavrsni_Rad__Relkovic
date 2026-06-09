"use client";

import { useState } from "react";

interface Props {
  images: string[];
  onSubmit: (answer: Record<string, unknown>) => void;
  disabled: boolean;
}

interface Item {
  url: string;
  originalIndex: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

function ensureShuffled<T extends { originalIndex: number }>(arr: T[]): T[] {
  if (arr.length <= 1) return arr;
  let result = shuffle(arr);
  let attempts = 0;
  while (result.every((item, i) => item.originalIndex === i) && attempts < 10) {
    result = shuffle(arr);
    attempts++;
  }
  return result;
}

export default function ImageOrder({ images, onSubmit, disabled }: Props) {
  const [items, setItems] = useState<Item[]>(() =>
    ensureShuffled(images.map((url, i) => ({ url, originalIndex: i }))),
  );
  const [selected, setSelected] = useState<number | null>(null);

  function handleItemClick(idx: number) {
    if (disabled) return;
    if (selected === null) {
      setSelected(idx);
      return;
    }
    if (selected === idx) {
      setSelected(null);
      return;
    }
    // Zamijeni pozicije
    const next = [...items];
    const a = next[selected]!;
    const b = next[idx]!;
    next[selected] = b;
    next[idx] = a;
    setItems(next);
    setSelected(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/60">
        Klikni sliku pa klikni na željenu poziciju da ih zamijeniš
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item, idx) => (
          <div
            key={item.originalIndex}
            onClick={() => handleItemClick(idx)}
            className={`relative cursor-pointer overflow-hidden rounded-xl border-2 transition ${
              selected === idx
                ? "border-[hsl(280,100%,70%)] shadow-lg shadow-[hsl(280,100%,70%)]/30"
                : "border-white/10 hover:border-white/30"
            } ${disabled ? "cursor-default opacity-60" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={`Slika ${idx + 1}`}
              className="w-full select-none object-cover"
              draggable={false}
            />
            {/* Broj pozicije */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-1 text-center text-xs font-bold text-white">
              {idx + 1}. pozicija
            </div>
            {/* Marker odabira */}
            {selected === idx && (
              <div className="absolute inset-0 flex items-center justify-center bg-[hsl(280,100%,70%)]/20">
                <span className="rounded-full bg-[hsl(280,100%,70%)] px-3 py-1 text-xs font-bold text-black">
                  Odabrano
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => onSubmit({ order: items.map((i) => i.originalIndex) })}
        disabled={disabled}
        className="rounded-full bg-[hsl(280,100%,70%)] py-2.5 font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
      >
        Potvrdi redoslijed
      </button>
    </div>
  );
}
