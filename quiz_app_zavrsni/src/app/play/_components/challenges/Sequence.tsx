"use client";

import { useState } from "react";

interface Props {
  items: string[];
  onSubmit: (answer: Record<string, unknown>) => void;
  disabled: boolean;
}

interface Item { text: string; originalIndex: number; }

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

export default function Sequence({ items, onSubmit, disabled }: Props) {
  const [ordered, setOrdered] = useState<Item[]>(() =>
    ensureShuffled(items.map((text, i) => ({ text, originalIndex: i }))),
  );
  const [selected, setSelected] = useState<number | null>(null);

  function handleClick(idx: number) {
    if (disabled) return;
    if (selected === null) { setSelected(idx); return; }
    if (selected === idx) { setSelected(null); return; }
    const next = [...ordered];
    [next[selected], next[idx]] = [next[idx]!, next[selected]!];
    setOrdered(next);
    setSelected(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: "var(--text-mut)" }}>
        Klikni stavku pa klikni na željenu poziciju da ih zamijeniš
      </p>
      <div className="flex flex-col gap-2">
        {ordered.map((item, idx) => {
          const isSelected = selected === idx;
          return (
            <div
              key={item.originalIndex}
              onClick={() => handleClick(idx)}
              className={`hoverable flex cursor-pointer items-center gap-3 rounded-[var(--r-md)] px-4 py-3 transition ${disabled ? "cursor-default opacity-60" : ""}`}
              style={{
                background: isSelected ? "rgba(230,57,70,0.12)" : "var(--glass-strong)",
                border: isSelected ? "1px solid rgba(230,57,70,0.5)" : "1px solid var(--border-soft)",
              }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  background: isSelected ? "var(--red)" : "rgba(168,218,220,0.12)",
                  color: isSelected ? "var(--cream)" : "var(--powder)",
                }}
              >
                {idx + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-cream">{item.text}</span>
              {isSelected && (
                <span className="text-xs font-semibold" style={{ color: "var(--powder)" }}>↕ odabrano</span>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={() => onSubmit({ order: ordered.map((i) => i.originalIndex) })}
        disabled={disabled}
        className="btn-primary mt-1 w-full py-3"
      >
        Potvrdi redoslijed
      </button>
    </div>
  );
}
