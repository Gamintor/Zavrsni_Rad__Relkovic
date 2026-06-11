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
    <main className="min-h-screen bg-[#15162c] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Odaberi kviz</h1>
          <Link href="/" className="text-sm text-white/50 hover:text-white transition">
            ← Natrag
          </Link>
        </div>

        {isLoading && <p className="text-white/50">Učitavanje...</p>}

        {!isLoading && quizzes?.length === 0 && (
          <p className="text-white/50">
            Nema dostupnih kvizova. Administrator još nije objavio nijedan.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes?.map((quiz) => (
            <div
              key={quiz.id}
              className="flex flex-col justify-between rounded-xl bg-white/10 p-6 transition hover:bg-white/[0.15]"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold">{quiz.title}</h3>
                {quiz.categories && quiz.categories.length > 0 && (
                  <p className="mt-0.5 text-sm text-white/50">
                    {quiz.categories.map((c) => c.name).join(", ")}
                  </p>
                )}
                <p className="mt-3 text-sm text-white/60">
                  {quiz._count.quizChallenges} izazova
                </p>
              </div>
              <button
                onClick={() => startSession.mutate({ quizId: quiz.id })}
                disabled={startSession.isPending}
                className="w-full rounded-full bg-[hsl(280,100%,70%)] py-2.5 font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
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
