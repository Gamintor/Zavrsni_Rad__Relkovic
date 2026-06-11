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
  const { data: categories, isLoading, refetch } = api.content.category.list.useQuery();
  const [form, setForm] = useState<Form>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);

  const create = api.content.category.create.useMutation({ onSuccess: () => { void refetch(); setForm(EMPTY); } });
  const update = api.content.category.update.useMutation({ onSuccess: () => { void refetch(); setEditId(null); setForm(EMPTY); } });
  const del = api.content.category.delete.useMutation({ onSuccess: () => void refetch() });

  const busy = create.isPending || update.isPending;

  function startEdit(cat: { id: string; name: string; slug: string; description: string | null }) {
    setEditId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? "" });
  }

  function cancelEdit() { setEditId(null); setForm(EMPTY); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId) { update.mutate({ id: editId, ...form }); }
    else { create.mutate(form); }
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold" style={{ color: "var(--cream)" }}>Kategorije</h1>

      <form onSubmit={handleSubmit} className="glass mb-8 rounded-[var(--r-card)] p-6">
        <h2 className="mb-4 font-semibold" style={{ color: "var(--cream)" }}>
          {editId ? "Uredi kategoriju" : "Nova kategorija"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm" style={{ color: "var(--text-mut)" }}>Naziv</span>
            <input
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, slug: editId ? f.slug : slugify(name) }));
              }}
              placeholder="npr. Geografija"
              required
              className="input-field"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm" style={{ color: "var(--text-mut)" }}>Slug</span>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              placeholder="npr. geografija"
              required
              className="input-field font-mono"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm" style={{ color: "var(--text-mut)" }}>Opis (opcionalno)</span>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Kratki opis kategorije"
              className="input-field"
            />
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={busy} className="btn-primary px-6 py-2 text-sm disabled:opacity-50">
            {editId ? "Spremi" : "Dodaj"}
          </button>
          {editId && (
            <button type="button" onClick={cancelEdit} className="btn-secondary px-6 py-2 text-sm">
              Odustani
            </button>
          )}
        </div>
        {(create.error ?? update.error) && (
          <p className="mt-2 text-sm" style={{ color: "var(--red)" }}>
            {(create.error ?? update.error)?.message}
          </p>
        )}
      </form>

      {isLoading && <p style={{ color: "var(--text-mut)" }}>Učitavanje...</p>}
      {categories?.length === 0 && <p style={{ color: "var(--text-mut)" }}>Nema kategorija. Dodajte prvu!</p>}
      {categories && categories.length > 0 && (
        <div className="glass overflow-hidden rounded-[var(--r-card)]">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--glass-strong)" }}>
                {["Naziv", "Slug", "Izazovi", "Kvizovi", ""].map((h) => (
                  <th key={h} className="p-3 text-left font-medium" style={{ color: "var(--text-mut)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="transition" style={{ borderTop: "1px solid var(--border-soft)" }}>
                  <td className="p-3 font-medium" style={{ color: "var(--cream)" }}>{cat.name}</td>
                  <td className="p-3 font-mono text-sm" style={{ color: "var(--text-mut)" }}>{cat.slug}</td>
                  <td className="p-3" style={{ color: "var(--text-mut)" }}>{cat._count.challenges}</td>
                  <td className="p-3" style={{ color: "var(--text-mut)" }}>{cat._count.quizzes}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => startEdit(cat)}
                      className="mr-2 rounded-[var(--r-tile)] px-3 py-1 text-xs transition"
                      style={{ color: "var(--powder)" }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "var(--glass-strong)")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      Uredi
                    </button>
                    <button
                      onClick={() => { if (confirm(`Obriši kategoriju "${cat.name}"?`)) del.mutate({ id: cat.id }); }}
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
