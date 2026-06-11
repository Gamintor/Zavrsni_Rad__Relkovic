"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

function fmt(n: number) {
  return n.toLocaleString("hr-HR");
}

function pct(ratio: number | null): string {
  if (ratio === null) return "—";
  return `${Math.round(ratio * 100)} %`;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white/10 p-5 text-center">
      <p className="text-3xl font-extrabold text-[hsl(280,100%,70%)]">
        {typeof value === "number" ? fmt(value) : value}
      </p>
      <p className="mt-1 text-sm font-semibold">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-white/40">{sub}</p>}
    </div>
  );
}

export default function ProfileClient() {
  const { data: stats, isLoading: statsLoading } =
    api.user.getStats.useQuery();
  const { data: history, isLoading: historyLoading } =
    api.leaderboard.myHistory.useQuery();

  return (
    <div className="space-y-10">
      {/* Statistike */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Statistike</h2>
        {statsLoading && <p className="text-white/50">Učitavanje...</p>}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              label="Ukupno bodova"
              value={stats.totalPoints}
            />
            <StatCard
              label="Odigranih sesija"
              value={stats.sessionsPlayed}
            />
            <StatCard
              label="Najbolji rezultat"
              value={stats.bestScore}
              sub="u jednoj igri"
            />
            <StatCard
              label="Win rate"
              value={pct(stats.winRate)}
              sub="multiplayer 1. mjesto"
            />
            <StatCard
              label="Streak rekord"
              value={stats.streakRecord}
              sub="uzastopnih točnih"
            />
            <StatCard
              label="Prosječna točnost"
              value={pct(stats.accuracy)}
              sub="svi odgovori"
            />
          </div>
        )}
      </section>

      {/* Povijest igranja */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Povijest igranja</h2>
        {historyLoading && <p className="text-white/50">Učitavanje...</p>}
        {!historyLoading && history?.length === 0 && (
          <p className="text-white/50">Još nema odigranih sesija.</p>
        )}
        {history && history.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  {["Kviz", "Način", "Bodovi", "Točnost", "Datum"].map((h) => (
                    <th
                      key={h}
                      className="p-3 text-left font-medium text-white/60"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((s) => {
                  const total = s.answers.length;
                  const correct = s.answers.filter((a) => a.isCorrect).length;
                  const accuracy =
                    total > 0 ? `${Math.round((correct / total) * 100)} %` : "—";
                  const isSolo = s.mode === "SOLO";
                  const date = new Date(s.startedAt).toLocaleDateString(
                    "hr-HR",
                    { day: "2-digit", month: "2-digit", year: "numeric" },
                  );

                  const titleCell = isSolo ? (
                    <Link
                      href={`/results/${s.id}`}
                      className="font-medium text-[hsl(280,100%,70%)] hover:underline"
                    >
                      {s.quiz.title}
                    </Link>
                  ) : (
                    <span className="font-medium">{s.quiz.title}</span>
                  );

                  return (
                    <tr
                      key={s.id}
                      className="border-t border-white/10 hover:bg-white/5"
                    >
                      <td className="p-3">{titleCell}</td>
                      <td className="p-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            isSolo
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-purple-500/20 text-purple-300"
                          }`}
                        >
                          {isSolo ? "Solo" : "Multi"}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-[hsl(280,100%,70%)]">
                        {fmt(s.totalScore)}
                      </td>
                      <td className="p-3 text-white/60">{accuracy}</td>
                      <td className="p-3 text-white/50">{date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
