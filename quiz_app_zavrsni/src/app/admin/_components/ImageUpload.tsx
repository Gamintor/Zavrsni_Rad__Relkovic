"use client";

import { UploadButton } from "~/utils/uploadthing";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export function ImageUpload({ value, onChange, label, className }: Props) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {label && (
        <span className="block text-sm" style={{ color: "var(--text-mut)" }}>{label}</span>
      )}

      {value && (
        <div className="group relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            className="max-h-48 rounded-[var(--r-tile)] object-contain"
            style={{ border: "1px solid var(--border-soft)" }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] shadow transition opacity-0 group-hover:opacity-100"
            style={{ background: "var(--red)", color: "var(--cream)" }}
            title="Ukloni sliku"
          >
            ✕
          </button>
        </div>
      )}

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
            "rounded-full px-4 py-2 text-sm font-medium transition ut-uploading:cursor-not-allowed ut-uploading:opacity-60",
          allowedContent: "text-xs mt-1",
        }}
        content={{
          button: value ? "Zamijeni sliku" : "Odaberi sliku",
        }}
      />
    </div>
  );
}
