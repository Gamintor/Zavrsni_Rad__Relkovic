"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";

export default function NewQuizPage() {
  const router = useRouter();
  const { data: categories } = api.content.category.list.useQuery();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  const create = api.content.quiz.create.useMutation({
    onSuccess: (quiz) => router.push(`/admin/quizzes/${quiz.id}/edit`),
  });

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold" style={{ color: "var(--cream)" }}>Novi kviz</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({
            title,
            description: description || undefined,
            categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
          });
        }}
        className="max-w-lg space-y-4"
      >
        <label className="block">
          <span className="mb-1 block text-sm" style={{ color: "var(--text-mut)" }}>Naziv kviza</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="npr. Opće znanje — teška razina"
            className="input-field"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm" style={{ color: "var(--text-mut)" }}>Opis (opcionalno)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-field"
          />
        </label>
        <fieldset className="block">
          <legend className="mb-2 text-sm" style={{ color: "var(--text-mut)" }}>
            Kategorije (opcionalno, više je moguće)
          </legend>
          {categories && categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const checked = categoryIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    className="pill text-xs font-semibold transition"
                    style={
                      checked
                        ? { background: "var(--powder)", color: "var(--navy)" }
                        : { background: "var(--glass-strong)", color: "var(--text-mut)", border: "1px solid var(--border-soft)" }
                    }
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-mut)" }}>Nema kategorija.</p>
          )}
        </fieldset>
        {create.error && (
          <p className="text-sm" style={{ color: "var(--red)" }}>{create.error.message}</p>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={create.isPending}
            className="btn-primary px-8 py-2.5 text-sm disabled:opacity-50"
          >
            {create.isPending ? "Kreiranje..." : "Kreiraj i dodaj izazove →"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary px-8 py-2.5 text-sm"
          >
            Odustani
          </button>
        </div>
      </form>
    </div>
  );
}
