"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function LeaderboardPage() {
  const { data: global, isLoading } = api.leaderboard.global.useQuery({ limit: 20 });
  const { data: quizzes } = api.game.listQuizzes.useQuery();
  const [selectedQuiz, setSelectedQuiz] = useState<string>("");
  const { data: quizBoard } = api.leaderboard.byQuiz.useQuery(
    { quizId: selectedQuiz, limit: 20 },
    { enabled: !!selectedQuiz },
  );

  const board = selectedQuiz ? quizBoard : global;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto max-w-2xl px-4 py-12">

        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold" style={{ color: "var(--cream)" }}>Ljestvica</h1>
          <Link
            href="/"
            className="text-sm transition"
            style={{ color: "var(--text-mut)" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--cream)")}
            onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-mut)")}
          >
            ← Natrag
          </Link>
        </div>

        {/* Filter po kviziü */}
        <div className="mb-6">
          <select
            value={selectedQuiz}
            onChange={(e) => setSelectedQuiz(e.target.value)}
            className="input-field py-2 text-sm"
            style={{ width: "auto", minWidth: "220px" }}
          >
            <option value="">Globalno (svi kvizovi)</option>
            {quizzes?.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
        </div>

        {isLoading && <p style={{ color: "var(--text-mut)" }}>Učitavanje...</p>}

        {board && board.length === 0 && (
          <p style={{ color: "var(--text-mut)" }}>Još nema rezultata.</p>
        )}

        {board && board.length > 0 && (
          <div className="glass overflow-hidden rounded-[var(--r-card)]">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--glass-strong)" }}>
                  {["#", "Igrač", "Kviz", "Bodovi"].map((h) => (
                    <th key={h} className="p-3 text-left font-medium" style={{ color: "var(--text-mut)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {board.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className="transition"
                    style={{ borderTop: "1px solid var(--border-soft)" }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "var(--glass-strong)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="w-10 p-3 text-center">
                      {i === 0 && "🥇"}
                      {i === 1 && "🥈"}
                      {i === 2 && "🥉"}
                      {i > 2 && (
                        <span className="font-bold" style={{ color: "var(--text-mut)" }}>{i + 1}.</span>
                      )}
                    </td>
                    <td className="p-3 font-medium" style={{ color: "var(--cream)" }}>
                      {entry.user.name ?? "Anonimni igrač"}
                    </td>
                    <td className="p-3" style={{ color: "var(--text-mut)" }}>
                      {"quiz" in entry
                        ? (entry.quiz as { title: string }).title
                        : "—"}
                    </td>
                    <td className="p-3 font-bold" style={{ color: "var(--powder)" }}>
                      {entry.totalScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
