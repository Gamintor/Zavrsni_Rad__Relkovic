"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";

export default function NewQuizPage() {
  const router = useRouter();
  const { data: categories } = api.content.category.list.useQuery();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const create = api.content.quiz.create.useMutation({
    // Redirect to edit page so admin can add challenges right away
    onSuccess: (quiz) => router.push(`/admin/quizzes/${quiz.id}/edit`),
  });

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Novi kviz</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({
            title,
            description: description || undefined,
            categoryId: categoryId || undefined,
          });
        }}
        className="max-w-lg space-y-4"
      >
        <label className="block">
          <span className="mb-1 block text-sm text-white/70">Naziv kviza</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="npr. Opće znanje — teška razina"
            className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-white/70">
            Opis (opcionalno)
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-white/70">
            Kategorija (opcionalno)
          </span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
          >
            <option value="">-- bez kategorije --</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {create.error && (
          <p className="text-sm text-red-400">{create.error.message}</p>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-full bg-[hsl(280,100%,70%)] px-8 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {create.isPending ? "Kreiranje..." : "Kreiraj i dodaj izazove →"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full bg-white/10 px-8 py-2.5 text-sm font-semibold transition hover:bg-white/20"
          >
            Odustani
          </button>
        </div>
      </form>
    </div>
  );
}
