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

const DIFF_COLORS: Record<Difficulty, string> = {
  EASY: "text-green-300",
  MEDIUM: "text-yellow-300",
  HARD: "text-red-300",
};

export default function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: quiz, isLoading, refetch } = api.content.quiz.getById.useQuery({ id });
  const { data: categories } = api.content.category.list.useQuery();
  const { data: allChallenges } = api.content.challenge.list.useQuery();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [challengeSearch, setChallengeSearch] = useState("");
  const [infoSaved, setInfoSaved] = useState(false);

  // Inicijalizira lokalni state kad podaci stignu
  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title);
      setDescription(quiz.description ?? "");
      setCategoryIds(quiz.categories.map((c) => c.id));
    }
  }, [quiz?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const updateQuiz = api.content.quiz.update.useMutation({
    onSuccess: () => {
      void refetch();
      setInfoSaved(true);
      setTimeout(() => setInfoSaved(false), 2000);
    },
  });
  const togglePublish = api.content.quiz.togglePublish.useMutation({
    onSuccess: () => void refetch(),
  });
  const addChallenge = api.content.quiz.addChallenge.useMutation({
    onSuccess: () => void refetch(),
  });
  const removeChallenge = api.content.quiz.removeChallenge.useMutation({
    onSuccess: () => void refetch(),
  });
  const reorder = api.content.quiz.reorderChallenges.useMutation({
    onSuccess: () => void refetch(),
  });

  if (isLoading) return <p className="text-white/50">Učitavanje...</p>;
  if (!quiz) return <p className="text-red-400">Kviz nije pronađen.</p>;

  const addedIds = new Set(quiz.quizChallenges.map((qc) => qc.challengeId));
  const filteredChallenges = allChallenges?.filter(
    (ch) =>
      !addedIds.has(ch.id) &&
      (challengeSearch === "" ||
        ch.prompt.toLowerCase().includes(challengeSearch.toLowerCase())),
  );

  function move(index: number, direction: -1 | 1) {
    if (!quiz) return;
    const items = [...quiz.quizChallenges];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    // Swap orders
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
        <h1 className="text-3xl font-bold">{quiz.title}</h1>
        <button
          onClick={() => togglePublish.mutate({ id })}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition hover:opacity-80 ${
            quiz.isPublished
              ? "bg-green-500/20 text-green-300"
              : "bg-white/10 text-white/50"
          }`}
        >
          {quiz.isPublished ? "Objavljeno" : "Objavi"}
        </button>
      </div>

      {/* Osnovne informacije */}
      <section className="rounded-xl bg-white/10 p-6">
        <h2 className="mb-4 font-semibold">Informacije o kvizu</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm text-white/70">Naziv</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm text-white/70">Opis</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
            />
          </label>
          <div className="block sm:col-span-2">
            <span className="mb-2 block text-sm text-white/70">
              Kategorije (više je moguće)
            </span>
            {categories && categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const checked = categoryIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        checked
                          ? "bg-[hsl(280,100%,70%)] text-black"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-white/40">Nema kategorija.</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() =>
              updateQuiz.mutate({
                id,
                title,
                description: description || null,
                categoryIds,
              })
            }
            disabled={updateQuiz.isPending}
            className="rounded-full bg-[hsl(280,100%,70%)] px-6 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            Spremi
          </button>
          {infoSaved && (
            <span className="text-sm text-green-400">Spremljeno ✓</span>
          )}
        </div>
      </section>

      {/* Izazovi u kvizu */}
      <section>
        <h2 className="mb-3 font-semibold">
          Izazovi u kvizu ({quiz.quizChallenges.length})
        </h2>
        {quiz.quizChallenges.length === 0 ? (
          <p className="text-sm text-white/50">
            Kviz nema izazova. Dodajte ih iz liste ispod.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  {["#", "Tip", "Pitanje", "Bodovi", "Limit", ""].map((h) => (
                    <th key={h} className="p-3 text-left font-medium text-white/70">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quiz.quizChallenges.map((qc, i) => (
                  <tr
                    key={qc.challengeId}
                    className="border-t border-white/10 hover:bg-white/5"
                  >
                    <td className="p-3 text-white/40">{i + 1}</td>
                    <td className="p-3">
                      <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-white/60">
                        {TYPE_SHORT[qc.challenge.type]}
                      </span>
                    </td>
                    <td className="max-w-xs p-3">
                      <span className="line-clamp-1">{qc.challenge.prompt}</span>
                    </td>
                    <td className={`p-3 ${DIFF_COLORS[qc.challenge.difficulty]}`}>
                      {qc.challenge.basePoints}
                    </td>
                    <td className="p-3 text-white/60">{qc.challenge.timeLimitSec}s</td>
                    <td className="p-3 text-right">
                      <button
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                        className="mr-1 rounded px-2 py-0.5 text-xs disabled:opacity-30 hover:bg-white/10"
                      >
                        ↑
                      </button>
                      <button
                        disabled={i === quiz.quizChallenges.length - 1}
                        onClick={() => move(i, 1)}
                        className="mr-3 rounded px-2 py-0.5 text-xs disabled:opacity-30 hover:bg-white/10"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() =>
                          removeChallenge.mutate({
                            quizId: id,
                            challengeId: qc.challengeId,
                          })
                        }
                        className="rounded px-3 py-1 text-xs text-red-400 hover:bg-red-400/10"
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
        <h2 className="mb-3 font-semibold">Dodaj izazove</h2>
        <input
          value={challengeSearch}
          onChange={(e) => setChallengeSearch(e.target.value)}
          placeholder="Pretraži izazove..."
          className="mb-3 w-full max-w-sm rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
        />
        {filteredChallenges && filteredChallenges.length === 0 && (
          <p className="text-sm text-white/50">
            {addedIds.size > 0 && allChallenges && addedIds.size === allChallenges.length
              ? "Svi dostupni izazovi su već dodani."
              : "Nema izazova koji odgovaraju pretrazi."}
          </p>
        )}
        {filteredChallenges && filteredChallenges.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <tbody>
                {filteredChallenges.map((ch) => (
                  <tr
                    key={ch.id}
                    className="border-t border-white/10 first:border-t-0 hover:bg-white/5"
                  >
                    <td className="p-3">
                      <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-white/60">
                        {TYPE_SHORT[ch.type]}
                      </span>
                    </td>
                    <td className="p-3 text-white/90">{ch.prompt}</td>
                    <td className="p-3 text-white/50">{ch.category.name}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() =>
                          addChallenge.mutate({
                            quizId: id,
                            challengeId: ch.id,
                          })
                        }
                        className="rounded-full bg-white/10 px-4 py-1 text-xs font-semibold transition hover:bg-white/20"
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
