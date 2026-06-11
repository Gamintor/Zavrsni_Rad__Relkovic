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
    <div className="glass rounded-[var(--r-card)] p-5 text-center">
      <p className="text-3xl font-extrabold" style={{ color: "var(--powder)" }}>
        {typeof value === "number" ? fmt(value) : value}
      </p>
      <p className="mt-1 text-sm font-semibold" style={{ color: "var(--cream)" }}>{label}</p>
      {sub && <p className="mt-0.5 text-xs" style={{ color: "var(--text-mut)" }}>{sub}</p>}
    </div>
  );
}

export default function ProfileClient() {
  const { data: stats, isLoading: statsLoading } = api.user.getStats.useQuery();
  const { data: history, isLoading: historyLoading } = api.leaderboard.myHistory.useQuery();

  return (
    <div className="space-y-10">
      {/* Statistike */}
      <section>
        <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--cream)" }}>Statistike</h2>
        {statsLoading && <p style={{ color: "var(--text-mut)" }}>Učitavanje...</p>}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Ukupno bodova" value={stats.totalPoints} />
            <StatCard label="Odigranih sesija" value={stats.sessionsPlayed} />
            <StatCard label="Najbolji rezultat" value={stats.bestScore} sub="u jednoj igri" />
            <StatCard label="Win rate" value={pct(stats.winRate)} sub="multiplayer 1. mjesto" />
            <StatCard label="Streak rekord" value={stats.streakRecord} sub="uzastopnih točnih" />
            <StatCard label="Prosječna točnost" value={pct(stats.accuracy)} sub="svi odgovori" />
          </div>
        )}
      </section>

      {/* Povijest igranja */}
      <section>
        <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--cream)" }}>Povijest igranja</h2>
        {historyLoading && <p style={{ color: "var(--text-mut)" }}>Učitavanje...</p>}
        {!historyLoading && history?.length === 0 && (
          <p style={{ color: "var(--text-mut)" }}>Još nema odigranih sesija.</p>
        )}
        {history && history.length > 0 && (
          <div className="glass overflow-hidden rounded-[var(--r-card)]">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--glass-strong)" }}>
                  {["Kviz", "Način", "Bodovi", "Točnost", "Datum"].map((h) => (
                    <th key={h} className="p-3 text-left font-medium" style={{ color: "var(--text-mut)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((s) => {
                  const total = s.answers.length;
                  const correct = s.answers.filter((a) => a.isCorrect).length;
                  const accuracy = total > 0 ? `${Math.round((correct / total) * 100)} %` : "—";
                  const isSolo = s.mode === "SOLO";
                  const date = new Date(s.startedAt).toLocaleDateString("hr-HR", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                  });

                  const titleCell = isSolo ? (
                    <Link
                      href={`/results/${s.id}`}
                      className="font-medium transition hover:underline"
                      style={{ color: "var(--powder)" }}
                    >
                      {s.quiz.title}
                    </Link>
                  ) : (
                    <span className="font-medium" style={{ color: "var(--cream)" }}>{s.quiz.title}</span>
                  );

                  return (
                    <tr key={s.id} className="transition" style={{ borderTop: "1px solid var(--border-soft)" }}>
                      <td className="p-3">{titleCell}</td>
                      <td className="p-3">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs"
                          style={
                            isSolo
                              ? { background: "rgba(69,123,157,0.2)", color: "var(--powder)" }
                              : { background: "rgba(42,157,143,0.2)", color: "var(--green)" }
                          }
                        >
                          {isSolo ? "Solo" : "Multi"}
                        </span>
                      </td>
                      <td className="p-3 font-bold" style={{ color: "var(--powder)" }}>
                        {fmt(s.totalScore)}
                      </td>
                      <td className="p-3" style={{ color: "var(--text-mut)" }}>{accuracy}</td>
                      <td className="p-3" style={{ color: "var(--text-mut)" }}>{date}</td>
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
