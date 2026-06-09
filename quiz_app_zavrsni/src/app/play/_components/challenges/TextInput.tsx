"use client";

import { useState } from "react";

interface Props {
  onSubmit: (answer: { text: string }) => void;
  disabled?: boolean;
}

export default function TextInput({ onSubmit, disabled }: Props) {
  const [text, setText] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && text.trim()) onSubmit({ text: text.trim() });
      }}
      className="space-y-3"
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder="Upiši odgovor..."
        autoFocus
        className="w-full rounded-xl bg-white/10 px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-[hsl(280,100%,70%)] disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled ?? !text.trim()}
        className="w-full rounded-full bg-[hsl(280,100%,70%)] py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
      >
        Potvrdi odgovor
      </button>
    </form>
  );
}
