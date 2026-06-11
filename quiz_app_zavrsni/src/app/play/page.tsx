"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function PlayPage() {
  const router = useRouter();
  const { data: quizzes, isLoading } = api.game.listQuizzes.useQuery();

  const startSession = api.game.startSession.useMutation({
    onSuccess: (data) => router.push(`/play/${data.sessionId}`),
  });

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold" style={{ color: "var(--cream)" }}>Odaberi kviz</h1>
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

        {isLoading && <p style={{ color: "var(--text-mut)" }}>Učitavanje...</p>}

        {!isLoading && quizzes?.length === 0 && (
          <p style={{ color: "var(--text-mut)" }}>
            Nema dostupnih kvizova. Administrator još nije objavio nijedan.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes?.map((quiz) => (
            <div
              key={quiz.id}
              className="glass hoverable flex flex-col justify-between rounded-[var(--r-card)] p-6 transition"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold" style={{ color: "var(--cream)" }}>{quiz.title}</h3>
                {quiz.categories && quiz.categories.length > 0 && (
                  <p className="mt-0.5 text-sm" style={{ color: "var(--text-mut)" }}>
                    {quiz.categories.map((c) => c.name).join(", ")}
                  </p>
                )}
                <p className="mt-3 text-sm" style={{ color: "var(--text-mut)" }}>
                  {quiz._count.quizChallenges} izazova
                </p>
              </div>
              <button
                onClick={() => startSession.mutate({ quizId: quiz.id })}
                disabled={startSession.isPending}
                className="btn-primary w-full py-2.5 disabled:opacity-50"
              >
                {startSession.isPending ? "Pokretanje..." : "Igraj →"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
