"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

export default function QuizzesPage() {
  const { data: quizzes, isLoading, refetch } = api.content.quiz.list.useQuery();

  const del = api.content.quiz.delete.useMutation({
    onSuccess: () => void refetch(),
  });
  const togglePublish = api.content.quiz.togglePublish.useMutation({
    onSuccess: () => void refetch(),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Kvizovi</h1>
        <Link
          href="/admin/quizzes/new"
          className="rounded-full bg-[hsl(280,100%,70%)] px-6 py-2 text-sm font-semibold text-black transition hover:opacity-90"
        >
          + Novi kviz
        </Link>
      </div>

      {isLoading && <p className="text-white/50">Učitavanje...</p>}
      {!isLoading && quizzes?.length === 0 && (
        <p className="text-white/50">Nema kvizova. Kreirajte prvi!</p>
      )}
      {quizzes && quizzes.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                {["Naziv", "Kategorija", "Izazovi", "Status", "Autor", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="p-3 text-left font-medium text-white/70"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr
                  key={q.id}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className="p-3 font-medium">{q.title}</td>
                  <td className="p-3 text-white/60">
                    {q.categories.length > 0
                      ? q.categories.map((c) => c.name).join(", ")
                      : "—"}
                  </td>
                  <td className="p-3 text-white/60">
                    {q._count.quizChallenges}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => togglePublish.mutate({ id: q.id })}
                      className={`rounded px-2 py-0.5 text-xs transition hover:opacity-80 ${
                        q.isPublished
                          ? "bg-green-500/20 text-green-300"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {q.isPublished ? "Objavljeno" : "Skica"}
                    </button>
                  </td>
                  <td className="p-3 text-white/60">
                    {q.createdBy.name ?? "—"}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/quizzes/${q.id}/edit`}
                      className="mr-2 rounded px-3 py-1 text-xs transition hover:bg-white/10"
                    >
                      Uredi
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(`Obriši kviz "${q.title}"?`))
                          del.mutate({ id: q.id });
                      }}
                      className="rounded px-3 py-1 text-xs text-red-400 transition hover:bg-red-400/10"
                    >
                      Briši
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
