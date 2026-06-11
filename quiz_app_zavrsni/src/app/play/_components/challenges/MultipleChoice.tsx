"use client";

import { useState } from "react";

interface Props {
  options: string[];
  onSubmit: (answer: { indices: number[] }) => void;
  disabled?: boolean;
}

export default function MultipleChoice({ options, onSubmit, disabled }: Props) {
  const [selected, setSelected] = useState<number[]>([]);

  function toggle(i: number) {
    if (disabled) return;
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  }

  return (
    <div className="space-y-2.5">
      {options.map((opt, i) => {
        const isSelected = selected.includes(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            disabled={disabled}
            className="hoverable flex w-full items-center gap-4 rounded-[var(--r-md)] px-4 py-3.5 text-left text-base font-semibold text-cream transition disabled:cursor-default"
            style={{
              background: isSelected ? "rgba(230,57,70,0.14)" : "var(--glass-strong)",
              border: isSelected ? "1px solid rgba(230,57,70,0.55)" : "1px solid var(--border-soft)",
            }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-xs font-extrabold transition"
              style={{
                background: isSelected ? "var(--red)" : "rgba(168,218,220,0.12)",
                border: isSelected ? "1px solid var(--red)" : "1px solid var(--border-soft)",
                color: isSelected ? "var(--cream)" : "var(--powder)",
              }}
            >
              {String.fromCharCode(65 + i)}
            </span>
            {opt}
          </button>
        );
      })}
      <button
        onClick={() => !disabled && selected.length > 0 && onSubmit({ indices: selected })}
        disabled={disabled ?? selected.length === 0}
        className="btn-primary mt-2 w-full py-3"
      >
        Potvrdi odgovor
      </button>
    </div>
  );
}
