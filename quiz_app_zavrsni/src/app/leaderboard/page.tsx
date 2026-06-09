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
    <main className="min-h-screen bg-[#15162c] text-white">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Ljestvica</h1>
          <Link href="/" className="text-sm text-white/50 hover:text-white transition">
            ← Natrag
          </Link>
        </div>

        {/* Filter po kviziü */}
        <div className="mb-6">
          <select
            value={selectedQuiz}
            onChange={(e) => setSelectedQuiz(e.target.value)}
            className="rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
          >
            <option value="">Globalno (svi kvizovi)</option>
            {quizzes?.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
        </div>

        {isLoading && <p className="text-white/50">Učitavanje...</p>}

        {board && board.length === 0 && (
          <p className="text-white/50">Još nema rezultata.</p>
        )}

        {board && board.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  {["#", "Igrač", "Kviz", "Bodovi"].map((h) => (
                    <th key={h} className="p-3 text-left font-medium text-white/70">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {board.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className="border-t border-white/10 hover:bg-white/5"
                  >
                    <td className="w-10 p-3 text-center">
                      {i === 0 && "🥇"}
                      {i === 1 && "🥈"}
                      {i === 2 && "🥉"}
                      {i > 2 && (
                        <span className="font-bold text-white/40">{i + 1}.</span>
                      )}
                    </td>
                    <td className="p-3 font-medium">
                      {entry.user.name ?? "Anonimni igrač"}
                    </td>
                    <td className="p-3 text-white/60">
                      {"quiz" in entry
                        ? (entry.quiz as { title: string }).title
                        : "—"}
                    </td>
                    <td className="p-3 font-bold text-[hsl(280,100%,70%)]">
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
