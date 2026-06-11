"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

export default function QuizzesPage() {
  const { data: quizzes, isLoading, refetch } = api.content.quiz.list.useQuery();
  const del = api.content.quiz.delete.useMutation({ onSuccess: () => void refetch() });
  const togglePublish = api.content.quiz.togglePublish.useMutation({ onSuccess: () => void refetch() });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ color: "var(--cream)" }}>Kvizovi</h1>
        <Link href="/admin/quizzes/new" className="btn-primary px-6 py-2 text-sm">
          + Novi kviz
        </Link>
      </div>

      {isLoading && <p style={{ color: "var(--text-mut)" }}>Učitavanje...</p>}
      {!isLoading && quizzes?.length === 0 && (
        <p style={{ color: "var(--text-mut)" }}>Nema kvizova. Kreirajte prvi!</p>
      )}
      {quizzes && quizzes.length > 0 && (
        <div className="glass overflow-hidden rounded-[var(--r-card)]">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--glass-strong)" }}>
                {["Naziv", "Kategorija", "Izazovi", "Status", "Autor", ""].map((h) => (
                  <th key={h} className="p-3 text-left font-medium" style={{ color: "var(--text-mut)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q.id} className="transition" style={{ borderTop: "1px solid var(--border-soft)" }}>
                  <td className="p-3 font-medium" style={{ color: "var(--cream)" }}>{q.title}</td>
                  <td className="p-3" style={{ color: "var(--text-mut)" }}>
                    {q.categories.length > 0 ? q.categories.map((c) => c.name).join(", ") : "—"}
                  </td>
                  <td className="p-3" style={{ color: "var(--text-mut)" }}>{q._count.quizChallenges}</td>
                  <td className="p-3">
                    <button
                      onClick={() => togglePublish.mutate({ id: q.id })}
                      className="rounded-full px-2 py-0.5 text-xs transition hover:opacity-80"
                      style={
                        q.isPublished
                          ? { background: "rgba(42,157,143,0.2)", color: "var(--green)" }
                          : { background: "var(--glass-strong)", color: "var(--text-mut)" }
                      }
                    >
                      {q.isPublished ? "Objavljeno" : "Skica"}
                    </button>
                  </td>
                  <td className="p-3" style={{ color: "var(--text-mut)" }}>{q.createdBy.name ?? "—"}</td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/quizzes/${q.id}/edit`}
                      className="mr-2 rounded-[var(--r-tile)] px-3 py-1 text-xs transition"
                      style={{ color: "var(--powder)" }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "var(--glass-strong)")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      Uredi
                    </Link>
                    <button
                      onClick={() => { if (confirm(`Obriši kviz "${q.title}"?`)) del.mutate({ id: q.id }); }}
                      className="rounded-[var(--r-tile)] px-3 py-1 text-xs transition"
                      style={{ color: "var(--red)" }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "rgba(230,57,70,0.1)")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
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
