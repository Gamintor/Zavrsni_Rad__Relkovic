"use client";

import { useState } from "react";

interface Props {
  images: string[];
  onSubmit: (answer: Record<string, unknown>) => void;
  disabled: boolean;
}

interface Item { url: string; originalIndex: number; }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
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
    if (selected === null) { setSelected(idx); return; }
    if (selected === idx) { setSelected(null); return; }
    const next = [...items];
    [next[selected], next[idx]] = [next[idx]!, next[selected]!];
    setItems(next);
    setSelected(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: "var(--text-mut)" }}>
        Klikni sliku pa klikni na željenu poziciju da ih zamijeniš
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item, idx) => {
          const isSelected = selected === idx;
          return (
            <div
              key={item.originalIndex}
              onClick={() => handleItemClick(idx)}
              className={`hoverable relative cursor-pointer overflow-hidden rounded-[var(--r-md)] transition ${disabled ? "cursor-default opacity-60" : ""}`}
              style={{
                border: isSelected ? "2px solid var(--red)" : "2px solid var(--border-soft)",
                boxShadow: isSelected ? "0 0 20px rgba(230,57,70,0.3)" : "none",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={`Slika ${idx + 1}`} className="w-full select-none object-cover" draggable={false} />
              <div className="absolute bottom-0 left-0 right-0 py-1 text-center text-xs font-bold text-cream" style={{ background: "rgba(14,28,48,0.7)" }}>
                {idx + 1}. pozicija
              </div>
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(230,57,70,0.18)" }}>
                  <span className="rounded-full px-3 py-1 text-xs font-bold text-cream" style={{ background: "var(--red)" }}>Odabrano</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={() => onSubmit({ order: items.map((i) => i.originalIndex) })} disabled={disabled} className="btn-primary w-full py-3">
        Potvrdi redoslijed
      </button>
    </div>
  );
}
