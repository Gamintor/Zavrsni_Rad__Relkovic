"use client";

import { use, useEffect, useState } from "react";
import { api } from "~/trpc/react";
import type { ChallengeType, Difficulty } from "../../../../../../generated/prisma";

const TYPE_SHORT: Record<ChallengeType, string> = {
  MULTIPLE_CHOICE: "MC",
  TRUE_FALSE: "TF",
  TEXT_INPUT: "TI",
  VISUAL_CLICK: "VC",
  SPOT_DIFFERENCE: "SD",
  IMAGE_ORDER: "IO",
  PUZZLE: "PZ",
  MEMORY: "ME",
  SEQUENCE: "SQ",
};

const DIFF_COLOR: Record<Difficulty, string> = {
  EASY: "var(--green)",
  MEDIUM: "#e6c839",
  HARD: "var(--red)",
};

export default function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: quiz, isLoading, refetch } = api.content.quiz.getById.useQuery({ id });
  const { data: categories } = api.content.category.list.useQuery();
  const { data: allChallenges } = api.content.challenge.list.useQuery();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [challengeSearch, setChallengeSearch] = useState("");
  const [infoSaved, setInfoSaved] = useState(false);

  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title);
      setDescription(quiz.description ?? "");
      setCategoryIds(quiz.categories.map((c) => c.id));
    }
  }, [quiz?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleCategory(catId: string) {
    setCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((x) => x !== catId) : [...prev, catId],
    );
  }

  const updateQuiz = api.content.quiz.update.useMutation({
    onSuccess: () => { void refetch(); setInfoSaved(true); setTimeout(() => setInfoSaved(false), 2000); },
  });
  const togglePublish = api.content.quiz.togglePublish.useMutation({ onSuccess: () => void refetch() });
  const addChallenge = api.content.quiz.addChallenge.useMutation({ onSuccess: () => void refetch() });
  const removeChallenge = api.content.quiz.removeChallenge.useMutation({ onSuccess: () => void refetch() });
  const reorder = api.content.quiz.reorderChallenges.useMutation({ onSuccess: () => void refetch() });

  if (isLoading) return <p style={{ color: "var(--text-mut)" }}>Učitavanje...</p>;
  if (!quiz) return <p style={{ color: "var(--red)" }}>Kviz nije pronađen.</p>;

  const addedIds = new Set(quiz.quizChallenges.map((qc) => qc.challengeId));
  const filteredChallenges = allChallenges?.filter(
    (ch) =>
      !addedIds.has(ch.id) &&
      (challengeSearch === "" || ch.prompt.toLowerCase().includes(challengeSearch.toLowerCase())),
  );

  function move(index: number, direction: -1 | 1) {
    if (!quiz) return;
    const items = [...quiz.quizChallenges];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const newOrder = items.map((qc, i) => ({
      challengeId: qc.challengeId,
      order: i === index ? target : i === target ? index : i,
    }));
    reorder.mutate({ quizId: id, order: newOrder });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-bold" style={{ color: "var(--cream)" }}>{quiz.title}</h1>
        <button
          onClick={() => togglePublish.mutate({ id })}
          className="rounded-full px-5 py-2 text-sm font-semibold transition hover:opacity-80"
          style={
            quiz.isPublished
              ? { background: "rgba(42,157,143,0.2)", color: "var(--green)" }
              : { background: "var(--glass-strong)", color: "var(--text-mut)" }
          }
        >
          {quiz.isPublished ? "Objavljeno" : "Objavi"}
        </button>
      </div>

      {/* Osnovne informacije */}
      <section className="glass rounded-[var(--r-card)] p-6">
        <h2 className="mb-4 font-semibold" style={{ color: "var(--cream)" }}>Informacije o kvizu</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm" style={{ color: "var(--text-mut)" }}>Naziv</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm" style={{ color: "var(--text-mut)" }}>Opis</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input-field" />
          </label>
          <div className="block sm:col-span-2">
            <span className="mb-2 block text-sm" style={{ color: "var(--text-mut)" }}>Kategorije (više je moguće)</span>
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
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => updateQuiz.mutate({ id, title, description: description || null, categoryIds })}
            disabled={updateQuiz.isPending}
            className="btn-primary px-6 py-2 text-sm disabled:opacity-50"
          >
            Spremi
          </button>
          {infoSaved && <span className="text-sm font-semibold" style={{ color: "var(--green)" }}>Spremljeno ✓</span>}
        </div>
      </section>

      {/* Izazovi u kvizu */}
      <section>
        <h2 className="mb-3 font-semibold" style={{ color: "var(--cream)" }}>
          Izazovi u kvizu ({quiz.quizChallenges.length})
        </h2>
        {quiz.quizChallenges.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-mut)" }}>Kviz nema izazova. Dodajte ih iz liste ispod.</p>
        ) : (
          <div className="glass overflow-hidden rounded-[var(--r-card)]">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--glass-strong)" }}>
                  {["#", "Tip", "Pitanje", "Bodovi", "Limit", ""].map((h) => (
                    <th key={h} className="p-3 text-left font-medium" style={{ color: "var(--text-mut)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quiz.quizChallenges.map((qc, i) => (
                  <tr key={qc.challengeId} className="transition" style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <td className="p-3" style={{ color: "var(--text-mut)" }}>{i + 1}</td>
                    <td className="p-3">
                      <span className="rounded-full px-2 py-0.5 font-mono text-xs" style={{ background: "var(--glass-strong)", color: "var(--powder)" }}>
                        {TYPE_SHORT[qc.challenge.type]}
                      </span>
                    </td>
                    <td className="max-w-xs p-3">
                      <span className="line-clamp-1" style={{ color: "var(--cream)" }}>{qc.challenge.prompt}</span>
                    </td>
                    <td className="p-3 font-semibold" style={{ color: DIFF_COLOR[qc.challenge.difficulty] }}>
                      {qc.challenge.basePoints}
                    </td>
                    <td className="p-3" style={{ color: "var(--text-mut)" }}>{qc.challenge.timeLimitSec}s</td>
                    <td className="p-3 text-right">
                      <button disabled={i === 0} onClick={() => move(i, -1)} className="mr-1 rounded-[var(--r-sm)] px-2 py-0.5 text-xs disabled:opacity-30 transition" style={{ color: "var(--cream)" }} onMouseOver={(e) => (e.currentTarget.style.background = "var(--glass-strong)")} onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}>↑</button>
                      <button disabled={i === quiz.quizChallenges.length - 1} onClick={() => move(i, 1)} className="mr-3 rounded-[var(--r-sm)] px-2 py-0.5 text-xs disabled:opacity-30 transition" style={{ color: "var(--cream)" }} onMouseOver={(e) => (e.currentTarget.style.background = "var(--glass-strong)")} onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}>↓</button>
                      <button
                        onClick={() => removeChallenge.mutate({ quizId: id, challengeId: qc.challengeId })}
                        className="rounded-[var(--r-tile)] px-3 py-1 text-xs transition"
                        style={{ color: "var(--red)" }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(230,57,70,0.1)")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        Ukloni
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Dodaj izazove */}
      <section>
        <h2 className="mb-3 font-semibold" style={{ color: "var(--cream)" }}>Dodaj izazove</h2>
        <input
          value={challengeSearch}
          onChange={(e) => setChallengeSearch(e.target.value)}
          placeholder="Pretraži izazove..."
          className="input-field mb-3 max-w-sm"
        />
        {filteredChallenges && filteredChallenges.length === 0 && (
          <p className="text-sm" style={{ color: "var(--text-mut)" }}>
            {addedIds.size > 0 && allChallenges && addedIds.size === allChallenges.length
              ? "Svi dostupni izazovi su već dodani."
              : "Nema izazova koji odgovaraju pretrazi."}
          </p>
        )}
        {filteredChallenges && filteredChallenges.length > 0 && (
          <div className="glass overflow-hidden rounded-[var(--r-card)]">
            <table className="w-full text-sm">
              <tbody>
                {filteredChallenges.map((ch, i) => (
                  <tr key={ch.id} className="transition" style={{ borderTop: i === 0 ? "none" : "1px solid var(--border-soft)" }}>
                    <td className="p-3">
                      <span className="rounded-full px-2 py-0.5 font-mono text-xs" style={{ background: "var(--glass-strong)", color: "var(--powder)" }}>
                        {TYPE_SHORT[ch.type]}
                      </span>
                    </td>
                    <td className="p-3" style={{ color: "var(--cream)" }}>{ch.prompt}</td>
                    <td className="p-3" style={{ color: "var(--text-mut)" }}>{ch.category.name}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => addChallenge.mutate({ quizId: id, challengeId: ch.id })}
                        className="btn-secondary px-4 py-1 text-xs font-semibold"
                      >
                        + Dodaj
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
