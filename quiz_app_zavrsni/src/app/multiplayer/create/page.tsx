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
    <main className="min-h-screen">
      <div className="container mx-auto max-w-lg px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold" style={{ color: "var(--cream)" }}>Multiplayer</h1>
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

        {/* Kreiraj sobu */}
        <div className="glass mb-6 rounded-[var(--r-card)] p-6">
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--cream)" }}>Kreiraj novu sobu</h2>
          {isLoading && <p className="text-sm" style={{ color: "var(--text-mut)" }}>Učitavanje kvizova...</p>}
          {!isLoading && quizzes?.length === 0 && (
            <p className="text-sm" style={{ color: "var(--text-mut)" }}>Nema dostupnih kvizova.</p>
          )}
          {(quizzes?.length ?? 0) > 0 && (
            <div className="space-y-3">
              <select
                value={selectedQuiz}
                onChange={(e) => setSelectedQuiz(e.target.value)}
                className="input-field"
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
                className="btn-primary w-full py-3 disabled:opacity-40"
              >
                {createRoom.isPending ? "Kreiranje..." : "Kreiraj sobu"}
              </button>
              {createRoom.error && (
                <p className="text-sm" style={{ color: "var(--red)" }}>{createRoom.error.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Pridruži se sobi */}
        <div className="glass rounded-[var(--r-card)] p-6">
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--cream)" }}>Pridruži se sobi</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Upiši kod sobe (npr. AB3X7K)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="input-field uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal"
            />
            <button
              onClick={() => joinRoom.mutate({ code: joinCode })}
              disabled={joinCode.length < 4 || joinRoom.isPending}
              className="btn-secondary w-full py-3 disabled:opacity-40"
            >
              {joinRoom.isPending ? "Pridruživanje..." : "Pridruži se"}
            </button>
            {joinRoom.error && (
              <p className="text-sm" style={{ color: "var(--red)" }}>{joinRoom.error.message}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
