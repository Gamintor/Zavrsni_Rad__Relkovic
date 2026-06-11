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
        className="input-field py-4 text-lg disabled:opacity-50"
      />
      <button type="submit" disabled={disabled ?? !text.trim()} className="btn-primary w-full py-3">
        Potvrdi odgovor
      </button>
    </form>
  );
}
