"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

type Form = { name: string; slug: string; description: string };
const EMPTY: Form = { name: "", slug: "", description: "" };

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export default function CategoriesPage() {
  const {
    data: categories,
    isLoading,
    refetch,
  } = api.content.category.list.useQuery();
  const [form, setForm] = useState<Form>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);

  const create = api.content.category.create.useMutation({
    onSuccess: () => {
      void refetch();
      setForm(EMPTY);
    },
  });
  const update = api.content.category.update.useMutation({
    onSuccess: () => {
      void refetch();
      setEditId(null);
      setForm(EMPTY);
    },
  });
  const del = api.content.category.delete.useMutation({
    onSuccess: () => void refetch(),
  });

  const busy = create.isPending || update.isPending;

  function startEdit(cat: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  }) {
    setEditId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? "" });
  }

  function cancelEdit() {
    setEditId(null);
    setForm(EMPTY);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId) {
      update.mutate({ id: editId, ...form });
    } else {
      create.mutate(form);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Kategorije</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-xl bg-white/10 p-6"
      >
        <h2 className="mb-4 font-semibold">
          {editId ? "Uredi kategoriju" : "Nova kategorija"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-white/70">Naziv</span>
            <input
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({
                  ...f,
                  name,
                  slug: editId ? f.slug : slugify(name),
                }));
              }}
              placeholder="npr. Geografija"
              required
              className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-white/70">Slug</span>
            <input
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
              }
              placeholder="npr. geografija"
              required
              className="w-full rounded bg-white/10 px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm text-white/70">
              Opis (opcionalno)
            </span>
            <input
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Kratki opis kategorije"
              className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
            />
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-[hsl(280,100%,70%)] px-6 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {editId ? "Spremi" : "Dodaj"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full bg-white/10 px-6 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              Odustani
            </button>
          )}
        </div>
        {(create.error ?? update.error) && (
          <p className="mt-2 text-sm text-red-400">
            {(create.error ?? update.error)?.message}
          </p>
        )}
      </form>

      {isLoading && <p className="text-white/50">Učitavanje...</p>}
      {categories?.length === 0 && (
        <p className="text-white/50">Nema kategorija. Dodajte prvu!</p>
      )}
      {categories && categories.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                {["Naziv", "Slug", "Izazovi", "Kvizovi", ""].map((h) => (
                  <th
                    key={h}
                    className="p-3 text-left font-medium text-white/70"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className="p-3 font-medium">{cat.name}</td>
                  <td className="p-3 font-mono text-white/60">{cat.slug}</td>
                  <td className="p-3 text-white/60">
                    {cat._count.challenges}
                  </td>
                  <td className="p-3 text-white/60">{cat._count.quizzes}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => startEdit(cat)}
                      className="mr-2 rounded px-3 py-1 text-xs transition hover:bg-white/10"
                    >
                      Uredi
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Obriši kategoriju "${cat.name}"?`))
                          del.mutate({ id: cat.id });
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
