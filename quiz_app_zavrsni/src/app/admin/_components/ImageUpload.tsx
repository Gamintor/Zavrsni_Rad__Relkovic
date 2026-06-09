"use client";

import { UploadButton } from "~/utils/uploadthing";

interface Props {
  /** Trenutni URL (prazno ako nije uploadano). */
  value: string;
  /** Zove se s novim URL-om nakon uspješnog uploada, ili "" za brisanje. */
  onChange: (url: string) => void;
  /** Label iznad komponente. */
  label?: string;
  /** Klase za vanjski wrapper. */
  className?: string;
}

/**
 * Wrapper oko UploadThing UploadButton-a.
 * Prikazuje preview uploadane slike, gumb za upload i gumb za brisanje.
 */
export function ImageUpload({ value, onChange, label, className }: Props) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {label && (
        <span className="block text-sm text-white/70">{label}</span>
      )}

      {/* Preview uploadane slike */}
      {value && (
        <div className="group relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            className="max-h-48 rounded-lg border border-white/10 object-contain"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white opacity-0 shadow transition group-hover:opacity-100"
            title="Ukloni sliku"
          >
            ✕
          </button>
        </div>
      )}

      {/* UploadThing gumb */}
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          const url = res[0]?.url;
          if (url) onChange(url);
        }}
        onUploadError={(err: Error) => {
          console.error("Upload error:", err.message);
          alert(`Greška pri uploadu: ${err.message}`);
        }}
        appearance={{
          button:
            "rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 ut-uploading:cursor-not-allowed ut-uploading:opacity-60 after:bg-[hsl(280,100%,70%)]",
          allowedContent: "text-xs text-white/30 mt-1",
        }}
        content={{
          button: value ? "Zamijeni sliku" : "Odaberi sliku",
        }}
      />
    </div>
  );
}
