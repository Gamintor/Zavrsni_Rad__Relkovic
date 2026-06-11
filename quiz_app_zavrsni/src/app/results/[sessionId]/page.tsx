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

  const { data: leaderboard } = api.leaderboard.byQuiz.useQuery(
    { quizId: session?.quiz.id ?? "", limit: 10 },
    { enabled: !!session?.quiz.id }
  );

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: "var(--text-mut)" }}>Učitavanje rezultata...</p>
      </div>
    );

  if (!session)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: "var(--red)" }}>Sesija nije pronađena.</p>
      </div>
    );

  const correct = session.answers.filter((a) => a.isCorrect).length;
  const total = session.answers.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto max-w-2xl px-4 py-12">

        {/* Hero rezultat */}
        <div className="glass mb-8 rounded-[var(--r-card)] p-8 text-center">
          <p className="mb-1 text-sm" style={{ color: "var(--text-mut)" }}>{session.quiz.title}</p>
          <p
            className="text-6xl font-extrabold"
            style={{ color: "var(--powder)", textShadow: "0 0 40px rgba(168,218,220,0.4)" }}
          >
            {session.totalScore}
          </p>
          <p className="mt-1" style={{ color: "var(--text-mut)" }}>bodova</p>
          <div className="mt-5 flex justify-center gap-8 text-sm">
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--green)" }}>{correct}</p>
              <p style={{ color: "var(--text-mut)" }}>točnih</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--red)" }}>{total - correct}</p>
              <p style={{ color: "var(--text-mut)" }}>netočnih</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--cream)" }}>{percentage}%</p>
              <p style={{ color: "var(--text-mut)" }}>uspješnost</p>
            </div>
          </div>
        </div>

        {/* Raščlamba odgovora */}
        <h2 className="mb-3 font-semibold" style={{ color: "var(--cream)" }}>Raščlamba odgovora</h2>
        <div className="glass mb-8 overflow-hidden rounded-[var(--r-card)]">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--glass-strong)" }}>
                {["#", "Pitanje", "Bodovi", "Trajanje"].map((h) => (
                  <th key={h} className="p-3 text-left font-medium" style={{ color: "var(--text-mut)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {session.answers.map((ans, i) => (
                <tr
                  key={ans.id}
                  className="transition"
                  style={{ borderTop: "1px solid var(--border-soft)" }}
                >
                  <td className="p-3" style={{ color: "var(--text-mut)" }}>{i + 1}</td>
                  <td className="max-w-xs p-3">
                    <span
                      className="mr-2 font-bold"
                      style={{ color: ans.isCorrect ? "var(--green)" : "var(--red)" }}
                    >
                      {ans.isCorrect ? "✓" : "✗"}
                    </span>
                    <span className="line-clamp-1" style={{ color: "var(--cream)" }}>{ans.challenge.prompt}</span>
                  </td>
                  <td className="p-3 font-semibold" style={{ color: "var(--powder)" }}>
                    {ans.pointsAwarded > 0 ? `+${ans.pointsAwarded}` : "—"}
                  </td>
                  <td className="p-3" style={{ color: "var(--text-mut)" }}>
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
            <h2 className="mb-3 font-semibold" style={{ color: "var(--cream)" }}>
              Ljestvica — {session.quiz.title}
            </h2>
            <div className="glass mb-8 overflow-hidden rounded-[var(--r-card)]">
              <table className="w-full text-sm">
                <tbody>
                  {leaderboard.map((entry, i) => {
                    const isMe = entry.totalScore === session.totalScore;
                    return (
                      <tr
                        key={entry.id}
                        style={{
                          borderTop: i === 0 ? "none" : "1px solid var(--border-soft)",
                          background: isMe ? "rgba(168,218,220,0.07)" : "transparent",
                        }}
                      >
                        <td className="w-10 p-3 text-center font-bold" style={{ color: "var(--text-mut)" }}>
                          {i + 1}.
                        </td>
                        <td className="p-3" style={{ color: "var(--cream)" }}>
                          {entry.user.name ?? "Anonimni igrač"}
                          {isMe && (
                            <span className="ml-2 text-xs font-semibold" style={{ color: "var(--powder)" }}>← Vi</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-bold" style={{ color: "var(--powder)" }}>
                          {entry.totalScore}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Akcije */}
        <div className="flex gap-3">
          <Link href="/play" className="btn-primary flex-1 py-3 text-center">
            Igraj opet
          </Link>
          <Link href="/" className="btn-secondary flex-1 py-3 text-center">
            Natrag na početak
          </Link>
        </div>
      </div>
    </main>
  );
}
