"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "~/trpc/react";
import type { ChallengeType, Difficulty } from "../../../../generated/prisma";

const TYPE_COLORS: Record<string, string> = {
  MULTIPLE_CHOICE: "bg-blue-500/20 text-blue-300",
  TRUE_FALSE: "bg-green-500/20 text-green-300",
  TEXT_INPUT: "bg-yellow-500/20 text-yellow-300",
  VISUAL_CLICK: "bg-purple-500/20 text-purple-300",
  SPOT_DIFFERENCE: "bg-pink-500/20 text-pink-300",
  IMAGE_ORDER: "bg-orange-500/20 text-orange-300",
  PUZZLE: "bg-teal-500/20 text-teal-300",
  MEMORY: "bg-indigo-500/20 text-indigo-300",
  SEQUENCE: "bg-red-500/20 text-red-300",
};

const DIFF_COLORS: Record<Difficulty, string> = {
  EASY: "bg-green-500/20 text-green-300",
  MEDIUM: "bg-yellow-500/20 text-yellow-300",
  HARD: "bg-red-500/20 text-red-300",
};
const DIFF_LABELS: Record<Difficulty, string> = {
  EASY: "Lako",
  MEDIUM: "Srednje",
  HARD: "Teško",
};

export default function ChallengesPage() {
  const { data: categories } = api.content.category.list.useQuery();
  const [filter, setFilter] = useState<{
    categoryId?: string;
    type?: ChallengeType;
    difficulty?: Difficulty;
  }>({});

  const {
    data: challenges,
    isLoading,
    refetch,
  } = api.content.challenge.list.useQuery(filter);
  const del = api.content.challenge.delete.useMutation({
    onSuccess: () => void refetch(),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Izazovi</h1>
        <Link
          href="/admin/challenges/new"
          className="rounded-full bg-[hsl(280,100%,70%)] px-6 py-2 text-sm font-semibold text-black transition hover:opacity-90"
        >
          + Novi izazov
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={filter.categoryId ?? ""}
          onChange={(e) =>
            setFilter((f) => ({
              ...f,
              categoryId: e.target.value || undefined,
            }))
          }
          className="rounded bg-white/10 px-3 py-1.5 text-sm outline-none"
        >
          <option value="">Sve kategorije</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filter.type ?? ""}
          onChange={(e) =>
            setFilter((f) => ({
              ...f,
              type: (e.target.value as ChallengeType) || undefined,
            }))
          }
          className="rounded bg-white/10 px-3 py-1.5 text-sm outline-none"
        >
          <option value="">Svi tipovi</option>
          {Object.keys(TYPE_COLORS).map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={filter.difficulty ?? ""}
          onChange={(e) =>
            setFilter((f) => ({
              ...f,
              difficulty: (e.target.value as Difficulty) || undefined,
            }))
          }
          className="rounded bg-white/10 px-3 py-1.5 text-sm outline-none"
        >
          <option value="">Sve težine</option>
          {Object.entries(DIFF_LABELS).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-white/50">Učitavanje...</p>}
      {!isLoading && challenges?.length === 0 && (
        <p className="text-white/50">Nema izazova za odabrane filtere.</p>
      )}
      {challenges && challenges.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                {["Tip", "Pitanje", "Kategorija", "Težina", "Bodovi", "U kvizovima", ""].map(
                  (h) => (
                    <th key={h} className="p-3 text-left font-medium text-white/70">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {challenges.map((ch) => (
                <tr
                  key={ch.id}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-xs ${TYPE_COLORS[ch.type]}`}
                    >
                      {ch.type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="max-w-xs p-3">
                    <span className="line-clamp-2 text-white/90">{ch.prompt}</span>
                  </td>
                  <td className="p-3 text-white/60">{ch.category.name}</td>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${DIFF_COLORS[ch.difficulty]}`}
                    >
                      {DIFF_LABELS[ch.difficulty]}
                    </span>
                  </td>
                  <td className="p-3 text-white/60">{ch.basePoints}</td>
                  <td className="p-3 text-white/60">{ch._count.quizChallenges}</td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/challenges/${ch.id}/edit`}
                      className="mr-2 rounded px-3 py-1 text-xs transition hover:bg-white/10"
                    >
                      Uredi
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm("Obriši ovaj izazov?"))
                          del.mutate({ id: ch.id });
                      }}
                      className="rounded px-3 py-1 text-xs text-red-400 transition hover:bg-red-400/10"
                    >
                      Briši
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
