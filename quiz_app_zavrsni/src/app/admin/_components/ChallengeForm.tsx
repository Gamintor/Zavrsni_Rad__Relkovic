"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import {
  ChallengeType,
  Difficulty,
} from "../../../../generated/prisma";

// ─── Tip-specifični state ─────────────────────────────────────────────────────

type MCState = { options: string[]; correctIndices: number[] };
type TFState = { value: boolean };
type TIState = { text: string; caseSensitive: boolean };
type VCState = { x: number; y: number; tolerance: number };
type SDState = {
  imageB: string;
  differences: { x: number; y: number; radius: number }[];
};
type IOState = { images: string[] };
type PZState = { rows: number; cols: number };
type MEState = { pairs: { id: string; front: string; back: string }[] };
type SEState = { items: string[] };

type TypeState =
  | MCState
  | TFState
  | TIState
  | VCState
  | SDState
  | IOState
  | PZState
  | MEState
  | SEState;

function defaultState(type: ChallengeType): TypeState {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return { options: ["", "", "", ""], correctIndices: [] };
    case "TRUE_FALSE":
      return { value: true };
    case "TEXT_INPUT":
      return { text: "", caseSensitive: false };
    case "VISUAL_CLICK":
      return { x: 0.5, y: 0.5, tolerance: 0.05 };
    case "SPOT_DIFFERENCE":
      return { imageB: "", differences: [] };
    case "IMAGE_ORDER":
      return { images: ["", ""] };
    case "PUZZLE":
      return { rows: 3, cols: 3 };
    case "MEMORY":
      return { pairs: [{ id: uid(), front: "", back: "" }] };
    case "SEQUENCE":
      return { items: ["", ""] };
    default: {
      const _exhaustive: never = type;
      throw new Error(`Nepoznat tip: ${String(_exhaustive)}`);
    }
  }
}

function uid() {
  return Math.random().toString(36).slice(2);
}

// Gradi content i correctAnswer iz type-state-a
function buildJson(
  type: ChallengeType,
  state: TypeState,
): {
  content: Record<string, unknown>;
  correctAnswer: Record<string, unknown>;
} {
  switch (type) {
    case "MULTIPLE_CHOICE": {
      const s = state as MCState;
      return {
        content: { options: s.options },
        correctAnswer: { indices: s.correctIndices },
      };
    }
    case "TRUE_FALSE": {
      return { content: {}, correctAnswer: { value: (state as TFState).value } };
    }
    case "TEXT_INPUT": {
      const s = state as TIState;
      return {
        content: { caseSensitive: s.caseSensitive },
        correctAnswer: { text: s.text },
      };
    }
    case "VISUAL_CLICK": {
      const s = state as VCState;
      return {
        content: {},
        correctAnswer: { x: s.x, y: s.y, tolerance: s.tolerance },
      };
    }
    case "SPOT_DIFFERENCE": {
      const s = state as SDState;
      return {
        content: { imageB: s.imageB },
        correctAnswer: { differences: s.differences },
      };
    }
    case "IMAGE_ORDER": {
      const s = state as IOState;
      return {
        content: { images: s.images },
        correctAnswer: { order: s.images.map((_, i) => i) },
      };
    }
    case "PUZZLE": {
      const s = state as PZState;
      return { content: { rows: s.rows, cols: s.cols }, correctAnswer: {} };
    }
    case "MEMORY": {
      const s = state as MEState;
      return { content: { pairs: s.pairs }, correctAnswer: {} };
    }
    case "SEQUENCE": {
      const s = state as SEState;
      return {
        content: { items: s.items },
        correctAnswer: { order: s.items.map((_, i) => i) },
      };
    }
    default: {
      const _exhaustive: never = type;
      throw new Error(`Nepoznat tip: ${String(_exhaustive)}`);
    }
  }
}

// Parsira Prisma JSON nazad u type-state za edit mode
function parseToState(
  type: ChallengeType,
  content: unknown,
  correctAnswer: unknown,
): TypeState {
  const c = (content ?? {}) as Record<string, unknown>;
  const a = (correctAnswer ?? {}) as Record<string, unknown>;
  switch (type) {
    case "MULTIPLE_CHOICE":
      return {
        options: (c.options as string[]) ?? ["", "", "", ""],
        correctIndices: (a.indices as number[]) ?? [],
      };
    case "TRUE_FALSE":
      return { value: (a.value as boolean) ?? true };
    case "TEXT_INPUT":
      return {
        text: (a.text as string) ?? "",
        caseSensitive: (c.caseSensitive as boolean) ?? false,
      };
    case "VISUAL_CLICK":
      return {
        x: (a.x as number) ?? 0.5,
        y: (a.y as number) ?? 0.5,
        tolerance: (a.tolerance as number) ?? 0.05,
      };
    case "SPOT_DIFFERENCE":
      return {
        imageB: (c.imageB as string) ?? "",
        differences:
          (a.differences as { x: number; y: number; radius: number }[]) ?? [],
      };
    case "IMAGE_ORDER":
      return { images: (c.images as string[]) ?? ["", ""] };
    case "PUZZLE":
      return { rows: (c.rows as number) ?? 3, cols: (c.cols as number) ?? 3 };
    case "MEMORY":
      return {
        pairs:
          (c.pairs as { id: string; front: string; back: string }[]) ?? [
            { id: uid(), front: "", back: "" },
          ],
      };
    case "SEQUENCE":
      return { items: (c.items as string[]) ?? ["", ""] };
    default: {
      const _exhaustive: never = type;
      throw new Error(`Nepoznat tip: ${String(_exhaustive)}`);
    }
  }
}

// ─── Tip-specifični form dijelovi ─────────────────────────────────────────────

function FieldsMC({
  state,
  set,
}: {
  state: MCState;
  set: (s: MCState) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-white/70">
        Opcije — označi jednu ili više točnih
      </p>
      {state.options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={state.correctIndices.includes(i)}
            onChange={(e) => {
              const idxs = e.target.checked
                ? [...state.correctIndices, i]
                : state.correctIndices.filter((x) => x !== i);
              set({ ...state, correctIndices: idxs });
            }}
            className="h-4 w-4 accent-[hsl(280,100%,70%)]"
          />
          <input
            value={opt}
            onChange={(e) => {
              const options = [...state.options];
              options[i] = e.target.value;
              set({ ...state, options });
            }}
            placeholder={`Opcija ${i + 1}`}
            className="flex-1 rounded bg-white/10 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
          />
          {state.options.length > 2 && (
            <button
              type="button"
              onClick={() => {
                const options = state.options.filter((_, j) => j !== i);
                const correctIndices = state.correctIndices
                  .filter((x) => x !== i)
                  .map((x) => (x > i ? x - 1 : x));
                set({ options, correctIndices });
              }}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => set({ ...state, options: [...state.options, ""] })}
        className="text-sm text-white/50 hover:text-white"
      >
        + Dodaj opciju
      </button>
    </div>
  );
}

function FieldsTF({ state, set }: { state: TFState; set: (s: TFState) => void }) {
  return (
    <div className="flex gap-4">
      {[true, false].map((v) => (
        <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={state.value === v}
            onChange={() => set({ value: v })}
            className="accent-[hsl(280,100%,70%)]"
          />
          <span>{v ? "Točno" : "Netočno"}</span>
        </label>
      ))}
    </div>
  );
}

function FieldsTI({ state, set }: { state: TIState; set: (s: TIState) => void }) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm text-white/70">Točan odgovor</span>
        <input
          value={state.text}
          onChange={(e) => set({ ...state, text: e.target.value })}
          placeholder="Upiši točan odgovor..."
          className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
        />
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={state.caseSensitive}
          onChange={(e) => set({ ...state, caseSensitive: e.target.checked })}
          className="accent-[hsl(280,100%,70%)]"
        />
        <span className="text-sm">Razlikuj velika/mala slova</span>
      </label>
    </div>
  );
}

function FieldsVC({ state, set }: { state: VCState; set: (s: VCState) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-white/70">
        Slika se postavlja u polje "URL slike" iznad. Koordinate su relativne
        (0–1).
      </p>
      {(
        [
          { key: "x", label: "Cilj X (0–1)" },
          { key: "y", label: "Cilj Y (0–1)" },
          { key: "tolerance", label: "Tolerancija (0–1)" },
        ] as { key: keyof VCState; label: string }[]
      ).map(({ key, label }) => (
        <label key={key} className="block">
          <span className="mb-1 block text-sm text-white/70">{label}</span>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={state[key]}
            onChange={(e) =>
              set({ ...state, [key]: parseFloat(e.target.value) })
            }
            className="w-32 rounded bg-white/10 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
          />
        </label>
      ))}
    </div>
  );
}

function FieldsSD({ state, set }: { state: SDState; set: (s: SDState) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-white/70">
        Slika A dolazi iz polja "URL slike" iznad.
      </p>
      <label className="block">
        <span className="mb-1 block text-sm text-white/70">URL slike B</span>
        <input
          value={state.imageB}
          onChange={(e) => set({ ...state, imageB: e.target.value })}
          placeholder="https://..."
          className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
        />
      </label>
      <p className="text-sm text-white/70">
        Razlike (x, y, radius — sve 0–1):
      </p>
      {state.differences.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          {(["x", "y", "radius"] as const).map((k) => (
            <input
              key={k}
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={d[k]}
              onChange={(e) => {
                const diffs = [...state.differences];
                diffs[i] = { ...d, [k]: parseFloat(e.target.value) };
                set({ ...state, differences: diffs });
              }}
              placeholder={k}
              className="w-20 rounded bg-white/10 px-2 py-1 text-sm outline-none"
            />
          ))}
          <button
            type="button"
            onClick={() =>
              set({
                ...state,
                differences: state.differences.filter((_, j) => j !== i),
              })
            }
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          set({
            ...state,
            differences: [...state.differences, { x: 0.5, y: 0.5, radius: 0.05 }],
          })
        }
        className="text-sm text-white/50 hover:text-white"
      >
        + Dodaj razliku
      </button>
    </div>
  );
}

function FieldsIO({ state, set }: { state: IOState; set: (s: IOState) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-white/70">
        Slike u točnom redoslijedu — igrač ih dobiva pomiješane.
      </p>
      {state.images.map((img, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-6 text-center text-sm text-white/40">{i + 1}.</span>
          <input
            value={img}
            onChange={(e) => {
              const images = [...state.images];
              images[i] = e.target.value;
              set({ images });
            }}
            placeholder="https://..."
            className="flex-1 rounded bg-white/10 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
          />
          {state.images.length > 2 && (
            <button
              type="button"
              onClick={() =>
                set({ images: state.images.filter((_, j) => j !== i) })
              }
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => set({ images: [...state.images, ""] })}
        className="text-sm text-white/50 hover:text-white"
      >
        + Dodaj sliku
      </button>
    </div>
  );
}

function FieldsPZ({ state, set }: { state: PZState; set: (s: PZState) => void }) {
  return (
    <div className="flex gap-6">
      {(["rows", "cols"] as const).map((k) => (
        <label key={k} className="block">
          <span className="mb-1 block text-sm text-white/70">
            {k === "rows" ? "Redovi" : "Stupci"}
          </span>
          <input
            type="number"
            min="2"
            max="6"
            value={state[k]}
            onChange={(e) => set({ ...state, [k]: parseInt(e.target.value) })}
            className="w-20 rounded bg-white/10 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
          />
        </label>
      ))}
    </div>
  );
}

function FieldsME({ state, set }: { state: MEState; set: (s: MEState) => void }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-sm text-white/70">
        <span>Prednja strana</span>
        <span>Stražnja strana</span>
      </div>
      {state.pairs.map((p, i) => (
        <div key={p.id} className="flex items-center gap-2">
          {(["front", "back"] as const).map((k) => (
            <input
              key={k}
              value={p[k]}
              onChange={(e) => {
                const pairs = [...state.pairs];
                pairs[i] = { ...p, [k]: e.target.value };
                set({ pairs });
              }}
              placeholder={k === "front" ? "Pojam..." : "Par..."}
              className="flex-1 rounded bg-white/10 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
            />
          ))}
          {state.pairs.length > 1 && (
            <button
              type="button"
              onClick={() =>
                set({ pairs: state.pairs.filter((_, j) => j !== i) })
              }
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          set({ pairs: [...state.pairs, { id: uid(), front: "", back: "" }] })
        }
        className="text-sm text-white/50 hover:text-white"
      >
        + Dodaj par
      </button>
    </div>
  );
}

function FieldsSE({ state, set }: { state: SEState; set: (s: SEState) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-white/70">
        Stavke u točnom redoslijedu — igrač ih dobiva pomiješane.
      </p>
      {state.items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-6 text-center text-sm text-white/40">{i + 1}.</span>
          <input
            value={item}
            onChange={(e) => {
              const items = [...state.items];
              items[i] = e.target.value;
              set({ items });
            }}
            placeholder={`Stavka ${i + 1}`}
            className="flex-1 rounded bg-white/10 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
          />
          {state.items.length > 2 && (
            <button
              type="button"
              onClick={() =>
                set({ items: state.items.filter((_, j) => j !== i) })
              }
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => set({ items: [...state.items, ""] })}
        className="text-sm text-white/50 hover:text-white"
      >
        + Dodaj stavku
      </button>
    </div>
  );
}

// ─── Glavni form ──────────────────────────────────────────────────────────────

type ExistingChallenge = {
  id: string;
  type: ChallengeType;
  prompt: string;
  content: unknown;
  correctAnswer: unknown;
  mediaUrl: string | null;
  difficulty: Difficulty;
  basePoints: number;
  timeLimitSec: number;
  categoryId: string;
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: "Lako",
  MEDIUM: "Srednje",
  HARD: "Teško",
};

const TYPE_LABELS: Record<ChallengeType, string> = {
  MULTIPLE_CHOICE: "Višestruki izbor",
  TRUE_FALSE: "Točno / Netočno",
  TEXT_INPUT: "Unos teksta",
  VISUAL_CLICK: "Klikni na sliku",
  SPOT_DIFFERENCE: "Pronađi razliku",
  IMAGE_ORDER: "Poredaj slike",
  PUZZLE: "Slagalica",
  MEMORY: "Pamćenje parova",
  SEQUENCE: "Redoslijed",
};

export default function ChallengeForm({
  existing,
}: {
  existing?: ExistingChallenge;
}) {
  const router = useRouter();
  const { data: categories } = api.content.category.list.useQuery();

  const [type, setType] = useState<ChallengeType>(
    existing?.type ?? "MULTIPLE_CHOICE",
  );
  const [prompt, setPrompt] = useState(existing?.prompt ?? "");
  const [mediaUrl, setMediaUrl] = useState(existing?.mediaUrl ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(
    existing?.difficulty ?? "MEDIUM",
  );
  const [basePoints, setBasePoints] = useState(existing?.basePoints ?? 100);
  const [timeLimitSec, setTimeLimitSec] = useState(
    existing?.timeLimitSec ?? 30,
  );
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? "");
  const [typeState, setTypeState] = useState<TypeState>(() =>
    existing
      ? parseToState(existing.type, existing.content, existing.correctAnswer)
      : defaultState("MULTIPLE_CHOICE"),
  );

  function handleTypeChange(newType: ChallengeType) {
    setType(newType);
    setTypeState(defaultState(newType));
  }

  const create = api.content.challenge.create.useMutation({
    onSuccess: () => router.push("/admin/challenges"),
  });
  const update = api.content.challenge.update.useMutation({
    onSuccess: () => router.push("/admin/challenges"),
  });

  const busy = create.isPending || update.isPending;
  const err = create.error ?? update.error;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { content, correctAnswer } = buildJson(type, typeState);
    const payload = {
      type,
      prompt,
      content,
      correctAnswer,
      mediaUrl: mediaUrl || null,
      difficulty,
      basePoints,
      timeLimitSec,
      categoryId,
    };
    if (existing) {
      update.mutate({ id: existing.id, ...payload });
    } else {
      create.mutate(payload);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tip izazova */}
      <label className="block">
        <span className="mb-1 block text-sm text-white/70">Tip izazova</span>
        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as ChallengeType)}
          className="rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
        >
          {Object.entries(TYPE_LABELS).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {/* Zajednička polja */}
      <label className="block">
        <span className="mb-1 block text-sm text-white/70">
          Pitanje / zadatak
        </span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          required
          placeholder="Upiši pitanje ili opis zadatka..."
          className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm text-white/70">
          URL slike / medija (opcionalno)
        </span>
        <input
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-sm text-white/70">Kategorija</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
          >
            <option value="">-- odaberi --</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-white/70">Težina</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
          >
            {Object.entries(DIFFICULTY_LABELS).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-white/70">Bodovi</span>
          <input
            type="number"
            min={1}
            max={1000}
            value={basePoints}
            onChange={(e) => setBasePoints(parseInt(e.target.value))}
            className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-white/70">
            Vremenski limit (s)
          </span>
          <input
            type="number"
            min={5}
            max={300}
            value={timeLimitSec}
            onChange={(e) => setTimeLimitSec(parseInt(e.target.value))}
            className="w-full rounded bg-white/10 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(280,100%,70%)]"
          />
        </label>
      </div>

      {/* Tip-specifični dio */}
      <div className="rounded-xl border border-white/20 p-5">
        <p className="mb-4 text-sm font-semibold text-[hsl(280,100%,70%)]">
          {TYPE_LABELS[type]}
        </p>
        {type === "MULTIPLE_CHOICE" && (
          <FieldsMC
            state={typeState as MCState}
            set={(s) => setTypeState(s)}
          />
        )}
        {type === "TRUE_FALSE" && (
          <FieldsTF
            state={typeState as TFState}
            set={(s) => setTypeState(s)}
          />
        )}
        {type === "TEXT_INPUT" && (
          <FieldsTI
            state={typeState as TIState}
            set={(s) => setTypeState(s)}
          />
        )}
        {type === "VISUAL_CLICK" && (
          <FieldsVC
            state={typeState as VCState}
            set={(s) => setTypeState(s)}
          />
        )}
        {type === "SPOT_DIFFERENCE" && (
          <FieldsSD
            state={typeState as SDState}
            set={(s) => setTypeState(s)}
          />
        )}
        {type === "IMAGE_ORDER" && (
          <FieldsIO
            state={typeState as IOState}
            set={(s) => setTypeState(s)}
          />
        )}
        {type === "PUZZLE" && (
          <FieldsPZ
            state={typeState as PZState}
            set={(s) => setTypeState(s)}
          />
        )}
        {type === "MEMORY" && (
          <FieldsME
            state={typeState as MEState}
            set={(s) => setTypeState(s)}
          />
        )}
        {type === "SEQUENCE" && (
          <FieldsSE
            state={typeState as SEState}
            set={(s) => setTypeState(s)}
          />
        )}
      </div>

      {err && <p className="text-sm text-red-400">{err.message}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-[hsl(280,100%,70%)] px-8 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Spremanje..." : existing ? "Spremi izmjene" : "Kreiraj izazov"}
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
  );
}
