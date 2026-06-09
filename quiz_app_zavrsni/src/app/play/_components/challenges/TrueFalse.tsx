"use client";

interface Props {
  onSubmit: (answer: { value: boolean }) => void;
  disabled?: boolean;
}

export default function TrueFalse({ onSubmit, disabled }: Props) {
  const options = [
    {
      value: true,
      label: "✓  Točno",
      cls: "border-green-500/50 bg-green-500/10 hover:bg-green-500/25",
    },
    {
      value: false,
      label: "✗  Netočno",
      cls: "border-red-500/50 bg-red-500/10 hover:bg-red-500/25",
    },
  ];

  return (
    <div className="flex gap-4">
      {options.map(({ value, label, cls }) => (
        <button
          key={String(value)}
          type="button"
          onClick={() => !disabled && onSubmit({ value })}
          disabled={disabled}
          className={`flex-1 rounded-xl border py-10 text-xl font-bold transition ${cls} disabled:cursor-default disabled:opacity-50`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
