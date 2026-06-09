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
    <div className="space-y-3">
      {options.map((opt, i) => (
        <button
          key={i}
          type="button"
          onClick={() => toggle(i)}
          disabled={disabled}
          className={`w-full rounded-xl px-5 py-4 text-left text-base font-medium transition ${
            selected.includes(i)
              ? "bg-[hsl(280,100%,70%)]/25 ring-2 ring-[hsl(280,100%,70%)]"
              : "bg-white/10 hover:bg-white/20"
          } disabled:cursor-default`}
        >
          <span className="mr-3 font-mono text-sm text-white/40">
            {String.fromCharCode(65 + i)}.
          </span>
          {opt}
        </button>
      ))}
      <button
        onClick={() => !disabled && selected.length > 0 && onSubmit({ indices: selected })}
        disabled={disabled ?? selected.length === 0}
        className="mt-2 w-full rounded-full bg-[hsl(280,100%,70%)] py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
      >
        Potvrdi odgovor
      </button>
    </div>
  );
}
