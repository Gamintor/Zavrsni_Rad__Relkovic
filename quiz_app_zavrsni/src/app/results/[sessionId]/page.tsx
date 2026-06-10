"use client";

import Link from "next/link";
import { use } from "react";
import { api } from "~/trpc/react";

export default function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const { data: session, isLoading } = api.game.getResults.useQuery({ sessionId });

  // Ljestvica za ovaj kviz
  const { data: leaderboard } = api.leaderboard.byQuiz.useQuery(
    {quizId: session?.quiz.id ?? "", limit: 10 },
    {enabled: !!session?.quiz.id}
  );

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15162c] text-white">
        <p className="text-white/50">Učitavanje rezultata...</p>
      </div>
    );

  if (!session)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15162c] text-white">
        <p className="text-red-400">Sesija nije pronađena.</p>
      </div>
    );

  const correct = session.answers.filter((a) => a.isCorrect).length;
  const total = session.answers.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;


  return (
    <main className="min-h-screen bg-[#15162c] text-white">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        {/* Hero rezultat */}
        <div className="mb-8 rounded-2xl bg-white/10 p-8 text-center">
          <p className="mb-1 text-sm text-white/50">{session.quiz.title}</p>
          <p className="text-6xl font-extrabold text-[hsl(280,100%,70%)]">
            {session.totalScore}
          </p>
          <p className="mt-1 text-white/70">bodova</p>
          <div className="mt-4 flex justify-center gap-8 text-sm">
            <div>
              <p className="text-2xl font-bold text-green-400">{correct}</p>
              <p className="text-white/50">točnih</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{total - correct}</p>
              <p className="text-white/50">netočnih</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{percentage}%</p>
              <p className="text-white/50">uspješnost</p>
            </div>
          </div>
        </div>

        {/* Raščlamba odgovora */}
        <h2 className="mb-3 font-semibold">Raščlamba odgovora</h2>
        <div className="mb-8 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                {["#", "Pitanje", "Bodovi", "Trajanje"].map((h) => (
                  <th key={h} className="p-3 text-left font-medium text-white/70">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {session.answers.map((ans, i) => (
                <tr
                  key={ans.id}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className="p-3 text-white/40">{i + 1}</td>
                  <td className="max-w-xs p-3">
                    <span
                      className={`mr-2 ${ans.isCorrect ? "text-green-400" : "text-red-400"}`}
                    >
                      {ans.isCorrect ? "✓" : "✗"}
                    </span>
                    <span className="line-clamp-1">{ans.challenge.prompt}</span>
                  </td>
                  <td className="p-3 font-semibold text-[hsl(280,100%,70%)]">
                    {ans.pointsAwarded > 0 ? `+${ans.pointsAwarded}` : "—"}
                  </td>
                  <td className="p-3 text-white/60">
                    {(ans.timeTakenMs / 1000).toFixed(1)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ljestvica kviza */}
        {leaderboard && leaderboard.length > 0 && (
          <>
            <h2 className="mb-3 font-semibold">Ljestvica — {session.quiz.title}</h2>
            <div className="mb-8 overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr
                      key={entry.id}
                      className={`border-t border-white/10 first:border-t-0 ${
                        entry.totalScore === session.totalScore
                          ? "bg-[hsl(280,100%,70%)]/10"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <td className="w-10 p-3 text-center font-bold text-white/40">
                        {i + 1}.
                      </td>
                      <td className="p-3">
                        {entry.user.name ?? "Anonimni igrač"}
                        {entry.totalScore === session.totalScore && (
                          <span className="ml-2 text-xs text-[hsl(280,100%,70%)]">← Vi</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold">
                        {entry.totalScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Akcije */}
        <div className="flex gap-3">
          <Link
            href="/play"
            className="flex-1 rounded-full bg-[hsl(280,100%,70%)] py-3 text-center font-semibold text-black transition hover:opacity-90"
          >
            Igraj opet
          </Link>
          <Link
            href="/"
            className="flex-1 rounded-full bg-white/10 py-3 text-center font-semibold transition hover:bg-white/20"
          >
            Natrag na početak
          </Link>
        </div>
      </div>
    </main>
  );
}
