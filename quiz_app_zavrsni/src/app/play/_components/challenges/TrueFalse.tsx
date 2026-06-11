"use client";

interface Props {
  onSubmit: (answer: { value: boolean }) => void;
  disabled?: boolean;
}

export default function TrueFalse({ onSubmit, disabled }: Props) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => !disabled && onSubmit({ value: true })}
        disabled={disabled}
        className="hoverable flex-1 rounded-[var(--r-md)] py-10 text-xl font-bold disabled:cursor-default disabled:opacity-50"
        style={{ background: "rgba(42,157,143,0.12)", border: "1px solid rgba(42,157,143,0.45)", color: "var(--green)" }}
      >
        ✓ Točno
      </button>
      <button
        type="button"
        onClick={() => !disabled && onSubmit({ value: false })}
        disabled={disabled}
        className="hoverable flex-1 rounded-[var(--r-md)] py-10 text-xl font-bold disabled:cursor-default disabled:opacity-50"
        style={{ background: "rgba(230,57,70,0.10)", border: "1px solid rgba(230,57,70,0.40)", color: "var(--red)" }}
      >
        ✗ Netočno
      </button>
    </div>
  );
}
