"use client";

import { useState } from "react";

interface Props {
  items: string[];
  onSubmit: (answer: Record<string, unknown>) => void;
  disabled: boolean;
}

interface Item {
  text: string;
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

export default function Sequence({ items, onSubmit, disabled }: Props) {
  const [ordered, setOrdered] = useState<Item[]>(() =>
    ensureShuffled(items.map((text, i) => ({ text, originalIndex: i }))),
  );
  const [selected, setSelected] = useState<number | null>(null);

  function handleClick(idx: number) {
    if (disabled) return;
    if (selected === null) {
      setSelected(idx);
      return;
    }
    if (selected === idx) {
      setSelected(null);
      return;
    }
    const next = [...ordered];
    const a = next[selected]!;
    const b = next[idx]!;
    next[selected] = b;
    next[idx] = a;
    setOrdered(next);
    setSelected(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-white/60">
        Klikni stavku pa klikni na željenu poziciju da ih zamijeniš
      </p>

      <div className="flex flex-col gap-2">
        {ordered.map((item, idx) => (
          <div
            key={item.originalIndex}
            onClick={() => handleClick(idx)}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition ${
              selected === idx
                ? "border-[hsl(280,100%,70%)] bg-[hsl(280,100%,70%)]/10"
                : "border-white/10 hover:border-white/30 hover:bg-white/5"
            } ${disabled ? "cursor-default opacity-60" : ""}`}
          >
            {/* Broj pozicije */}
            <span
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                selected === idx
                  ? "bg-[hsl(280,100%,70%)] text-black"
                  : "bg-white/10 text-white/60"
              }`}
            >
              {idx + 1}
            </span>
            <span className="flex-1 text-sm font-medium">{item.text}</span>
            {selected === idx && (
              <span className="text-xs text-[hsl(280,100%,70%)]">↕ odabrano</span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => onSubmit({ order: ordered.map((i) => i.originalIndex) })}
        disabled={disabled}
        className="mt-2 rounded-full bg-[hsl(280,100%,70%)] py-2.5 font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
      >
        Potvrdi redoslijed
      </button>
    </div>
  );
}
