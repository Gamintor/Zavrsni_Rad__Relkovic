"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function CreateRoomPage() {
  const router = useRouter();
  const { data: quizzes, isLoading } = api.game.listQuizzes.useQuery();
  const [selectedQuiz, setSelectedQuiz] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const createRoom = api.room.create.useMutation({
    onSuccess: ({ code }) => router.push(`/multiplayer/${code}`),
  });

  const joinRoom = api.room.join.useMutation({
    onSuccess: ({ code }) => router.push(`/multiplayer/${code}`),
  });

  return (
    <main className="min-h-screen bg-[#15162c] text-white">
      <div className="container mx-auto max-w-lg px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Multiplayer</h1>
          <Link href="/" className="text-sm text-white/50 transition hover:text-white">
            ← Natrag
          </Link>
        </div>

        {/* Kreiraj sobu */}
        <div className="mb-6 rounded-2xl bg-white/10 p-6">
          <h2 className="mb-4 text-lg font-semibold">Kreiraj novu sobu</h2>
          {isLoading && <p className="text-sm text-white/50">Učitavanje kvizova...</p>}
          {!isLoading && quizzes?.length === 0 && (
            <p className="text-sm text-white/50">Nema dostupnih kvizova.</p>
          )}
          {(quizzes?.length ?? 0) > 0 && (
            <div className="space-y-3">
              <select
                value={selectedQuiz}
                onChange={(e) => setSelectedQuiz(e.target.value)}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
              >
                <option value="">Odaberi kviz...</option>
                {quizzes?.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({q._count.quizChallenges} izazova)
                  </option>
                ))}
              </select>
              <button
                onClick={() => createRoom.mutate({ quizId: selectedQuiz })}
                disabled={!selectedQuiz || createRoom.isPending}
                className="w-full rounded-full bg-[hsl(280,100%,70%)] py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
              >
                {createRoom.isPending ? "Kreiranje..." : "Kreiraj sobu"}
              </button>
              {createRoom.error && (
                <p className="text-sm text-red-400">{createRoom.error.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Pridruži se sobi */}
        <div className="rounded-2xl bg-white/10 p-6">
          <h2 className="mb-4 text-lg font-semibold">Pridruži se sobi</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Upiši kod sobe (npr. AB3X7K)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm uppercase tracking-widest outline-none placeholder:normal-case placeholder:tracking-normal focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
            />
            <button
              onClick={() => joinRoom.mutate({ code: joinCode })}
              disabled={joinCode.length < 4 || joinRoom.isPending}
              className="w-full rounded-full bg-white/20 py-3 font-semibold transition hover:bg-white/30 disabled:opacity-40"
            >
              {joinRoom.isPending ? "Pridruživanje..." : "Pridruži se"}
            </button>
            {joinRoom.error && (
              <p className="text-sm text-red-400">{joinRoom.error.message}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
