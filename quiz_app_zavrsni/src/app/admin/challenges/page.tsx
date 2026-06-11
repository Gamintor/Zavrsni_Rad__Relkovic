"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "~/trpc/react";
import type { ChallengeType, Difficulty } from "../../../../generated/prisma";

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  MULTIPLE_CHOICE: { bg: "rgba(69,123,157,0.2)", color: "#a8dadc" },
  TRUE_FALSE: { bg: "rgba(42,157,143,0.2)", color: "#2a9d8f" },
  TEXT_INPUT: { bg: "rgba(230,200,57,0.15)", color: "#e6c839" },
  VISUAL_CLICK: { bg: "rgba(168,218,220,0.15)", color: "#a8dadc" },
  SPOT_DIFFERENCE: { bg: "rgba(230,57,70,0.15)", color: "#e63946" },
  IMAGE_ORDER: { bg: "rgba(241,250,238,0.1)", color: "#f1faee" },
  PUZZLE: { bg: "rgba(42,157,143,0.15)", color: "#2a9d8f" },
  MEMORY: { bg: "rgba(69,123,157,0.2)", color: "#457b9d" },
  SEQUENCE: { bg: "rgba(230,57,70,0.15)", color: "#e63946" },
};

const DIFF_STYLE: Record<Difficulty, { bg: string; color: string }> = {
  EASY: { bg: "rgba(42,157,143,0.2)", color: "#2a9d8f" },
  MEDIUM: { bg: "rgba(230,200,57,0.15)", color: "#e6c839" },
  HARD: { bg: "rgba(230,57,70,0.2)", color: "#e63946" },
};
const DIFF_LABELS: Record<Difficulty, string> = {
  EASY: "Lako",
  MEDIUM: "Srednje",
  HARD: "Teško",
};

export default function ChallengesPage() {
  const { data: categories } = api.content.category.list.useQuery();
  const [filter, setFilter] = useState<{ categoryId?: string; type?: ChallengeType; difficulty?: Difficulty }>({});
  const { data: challenges, isLoading, refetch } = api.content.challenge.list.useQuery(filter);
  const del = api.content.challenge.delete.useMutation({ onSuccess: () => void refetch() });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ color: "var(--cream)" }}>Izazovi</h1>
        <Link href="/admin/challenges/new" className="btn-primary px-6 py-2 text-sm">
          + Novi izazov
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          {
            value: filter.categoryId ?? "",
            onChange: (v: string) => setFilter((f) => ({ ...f, categoryId: v || undefined })),
            options: [
              { value: "", label: "Sve kategorije" },
              ...(categories?.map((c) => ({ value: c.id, label: c.name })) ?? []),
            ],
          },
          {
            value: filter.type ?? "",
            onChange: (v: string) => setFilter((f) => ({ ...f, type: (v as ChallengeType) || undefined })),
            options: [
              { value: "", label: "Svi tipovi" },
              ...Object.keys(TYPE_STYLE).map((t) => ({ value: t, label: t.replace(/_/g, " ") })),
            ],
          },
          {
            value: filter.difficulty ?? "",
            onChange: (v: string) => setFilter((f) => ({ ...f, difficulty: (v as Difficulty) || undefined })),
            options: [
              { value: "", label: "Sve težine" },
              ...Object.entries(DIFF_LABELS).map(([v, label]) => ({ value: v, label })),
            ],
          },
        ].map((sel, i) => (
          <select
            key={i}
            value={sel.value}
            onChange={(e) => sel.onChange(e.target.value)}
            className="input-field py-1.5 text-sm"
            style={{ width: "auto" }}
          >
            {sel.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
      </div>

      {isLoading && <p style={{ color: "var(--text-mut)" }}>Učitavanje...</p>}
      {!isLoading && challenges?.length === 0 && (
        <p style={{ color: "var(--text-mut)" }}>Nema izazova za odabrane filtere.</p>
      )}
      {challenges && challenges.length > 0 && (
        <div className="glass overflow-hidden rounded-[var(--r-card)]">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--glass-strong)" }}>
                {["Tip", "Pitanje", "Kategorija", "Težina", "Bodovi", "U kvizovima", ""].map((h) => (
                  <th key={h} className="p-3 text-left font-medium" style={{ color: "var(--text-mut)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {challenges.map((ch) => {
                const ts = TYPE_STYLE[ch.type];
                const ds = DIFF_STYLE[ch.difficulty];
                return (
                  <tr key={ch.id} className="transition" style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <td className="p-3">
                      <span
                        className="rounded-full px-2 py-0.5 font-mono text-xs"
                        style={{ background: ts?.bg, color: ts?.color }}
                      >
                        {ch.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="max-w-xs p-3">
                      <span className="line-clamp-2" style={{ color: "var(--cream)" }}>{ch.prompt}</span>
                    </td>
                    <td className="p-3" style={{ color: "var(--text-mut)" }}>{ch.category.name}</td>
                    <td className="p-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs"
                        style={{ background: ds?.bg, color: ds?.color }}
                      >
                        {DIFF_LABELS[ch.difficulty]}
                      </span>
                    </td>
                    <td className="p-3" style={{ color: "var(--text-mut)" }}>{ch.basePoints}</td>
                    <td className="p-3" style={{ color: "var(--text-mut)" }}>{ch._count.quizChallenges}</td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/challenges/${ch.id}/edit`}
                        className="mr-2 rounded-[var(--r-tile)] px-3 py-1 text-xs transition"
                        style={{ color: "var(--powder)" }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "var(--glass-strong)")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        Uredi
                      </Link>
                      <button
                        onClick={() => { if (confirm("Obriši ovaj izazov?")) del.mutate({ id: ch.id }); }}
                        className="rounded-[var(--r-tile)] px-3 py-1 text-xs transition"
                        style={{ color: "var(--red)" }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(230,57,70,0.1)")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        Briši
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
