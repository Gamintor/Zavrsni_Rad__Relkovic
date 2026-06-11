"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";
import {
  ChallengeType,
  Difficulty,
} from "../../../../generated/prisma";
import { ImageUpload } from "./ImageUpload";

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
      <p className="text-sm" style={{ color: "var(--text-mut)" }}>
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
            className="h-4 w-4 accent-[var(--powder)]"
          />
          <input
            value={opt}
            onChange={(e) => {
              const options = [...state.options];
              options[i] = e.target.value;
              set({ ...state, options });
            }}
            placeholder={`Opcija ${i + 1}`}
            className="input-field flex-1 py-1.5 text-sm"
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
              className="transition" style={{ color: "var(--red)" }}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => set({ ...state, options: [...state.options, ""] })}
        className="text-sm transition" style={{ color: "var(--text-mut)" }}
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
            className="accent-[var(--powder)]"
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
        <span className="mb-1 block text-sm" style={{ color: "var(--text-mut)" }}>Točan odgovor</span>
        <input
          value={state.text}
          onChange={(e) => set({ ...state, text: e.target.value })}
          placeholder="Upiši točan odgovor..."
          className="input-field"
        />
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={state.caseSensitive}
          onChange={(e) => set({ ...state, caseSensitive: e.target.checked })}
          className="accent-[var(--powder)]"
        />
        <span className="text-sm">Razlikuj velika/mala slova</span>
      </label>
    </div>
  );
}

function FieldsVC({
  state,
  set,
  mediaUrl,
}: {
  state: VCState;
  set: (s: VCState) => void;
  mediaUrl?: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    set({ ...state, x: parseFloat(x.toFixed(3)), y: parseFloat(y.toFixed(3)) });
  }

  return (
    <div className="space-y-4">
      {/* Klikabilni image preview za postavljanje koordinata */}
      {mediaUrl ? (
        <div className="space-y-2">
          <p className="text-sm" style={{ color: "var(--text-mut)" }}>
            Klikni na sliku da postaviš ciljnu točku (X, Y se automatski popune):
          </p>
          <div
            className="relative cursor-crosshair overflow-hidden rounded-[var(--r-md)]"
            onClick={handleImageClick}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={mediaUrl}
              alt="Klikni za postavljanje cilja"
              className="w-full select-none rounded-[var(--r-md)]"
              draggable={false}
            />
            {/* Marker trenutne pozicije */}
            <div
              className="pointer-events-none absolute"
              style={{
                left: `${state.x * 100}%`,
                top: `${state.y * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="h-6 w-6 rounded-full border-2" style={{ borderColor: "var(--cream)", background: "rgba(230,57,70,0.7)" }} />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--text-mut)" }}>
          Unesi URL slike iznad pa klikni na sliku za postavljanje cilja, ili ručno unesi koordinate.
        </p>
      )}

      {/* Ručni unos koordinata */}
      <div className="flex flex-wrap gap-4">
        {(
          [
            { key: "x", label: "Cilj X (0–1)" },
            { key: "y", label: "Cilj Y (0–1)" },
            { key: "tolerance", label: "Tolerancija (0–1)" },
          ] as { key: keyof VCState; label: string }[]
        ).map(({ key, label }) => (
          <label key={key} className="block">
            <span className="mb-1 block text-sm" style={{ color: "var(--text-mut)" }}>{label}</span>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={state[key]}
              onChange={(e) =>
                set({ ...state, [key]: parseFloat(e.target.value) })
              }
              className="input-field w-28 py-1.5 text-sm"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function FieldsSD({ state, set }: { state: SDState; set: (s: SDState) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm" style={{ color: "var(--text-mut)" }}>
        Slika A dolazi iz upload polja "Slika / medij" iznad.
      </p>
      <ImageUpload
        label="Slika B"
        value={state.imageB}
        onChange={(url) => set({ ...state, imageB: url })}
      />
      <p className="text-sm" style={{ color: "var(--text-mut)" }}>
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
              className="input-field w-20 py-1 text-sm"
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
            className="transition" style={{ color: "var(--red)" }}
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
        className="text-sm transition" style={{ color: "var(--text-mut)" }}
      >
        + Dodaj razliku
      </button>
    </div>
  );
}

function FieldsIO({ state, set }: { state: IOState; set: (s: IOState) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm" style={{ color: "var(--text-mut)" }}>
        Slike u točnom redoslijedu — igrač ih dobiva pomiješane.
      </p>
      {state.images.map((img, i) => (
        <div key={i} className="flex items-start gap-3 rounded-[var(--r-tile)] p-3" style={{ border: "1px solid var(--border-soft)" }}>
          <span className="mt-1 w-5 flex-shrink-0 text-center text-sm font-bold" style={{ color: "var(--text-mut)" }}>
            {i + 1}.
          </span>
          <div className="flex-1">
            <ImageUpload
              value={img}
              onChange={(url) => {
                const images = [...state.images];
                images[i] = url;
                set({ images });
              }}
            />
          </div>
          {state.images.length > 2 && (
            <button
              type="button"
              onClick={() =>
                set({ images: state.images.filter((_, j) => j !== i) })
              }
              className="mt-1 transition" style={{ color: "var(--red)" }}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => set({ images: [...state.images, ""] })}
        className="text-sm transition" style={{ color: "var(--text-mut)" }}
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
          <span className="mb-1 block text-sm" style={{ color: "var(--text-mut)" }}>
            {k === "rows" ? "Redovi" : "Stupci"}
          </span>
          <input
            type="number"
            min="2"
            max="6"
            value={state[k]}
            onChange={(e) => set({ ...state, [k]: parseInt(e.target.value) })}
            className="input-field w-20 py-1.5 text-sm"
          />
        </label>
      ))}
    </div>
  );
}

function FieldsME({ state, set }: { state: MEState; set: (s: MEState) => void }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-sm" style={{ color: "var(--text-mut)" }}>
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
              className="input-field flex-1 py-1.5 text-sm"
            />
          ))}
          {state.pairs.length > 1 && (
            <button
              type="button"
              onClick={() =>
                set({ pairs: state.pairs.filter((_, j) => j !== i) })
              }
              className="transition" style={{ color: "var(--red)" }}
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
        className="text-sm transition" style={{ color: "var(--text-mut)" }}
      >
        + Dodaj par
      </button>
    </div>
  );
}

function FieldsSE({ state, set }: { state: SEState; set: (s: SEState) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm" style={{ color: "var(--text-mut)" }}>
        Stavke u točnom redoslijedu — igrač ih dobiva pomiješane.
      </p>
      {state.items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-6 text-center text-sm" style={{ color: "var(--text-mut)" }}>{i + 1}.</span>
          <input
            value={item}
            onChange={(e) => {
              const items = [...state.items];
              items[i] = e.target.value;
              set({ items });
            }}
            placeholder={`Stavka ${i + 1}`}
            className="input-field flex-1 py-1.5 text-sm"
          />
          {state.items.length > 2 && (
            <button
              type="button"
              onClick={() =>
                set({ items: state.items.filter((_, j) => j !== i) })
              }
              className="transition" style={{ color: "var(--red)" }}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => set({ items: [...state.items, ""] })}
        className="text-sm transition" style={{ color: "var(--text-mut)" }}
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
        <span className="mb-1 block text-sm" style={{ color: "var(--text-mut)" }}>Tip izazova</span>
        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as ChallengeType)}
          className="input-field py-2 text-sm"
          style={{ width: "auto" }}
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
        <span className="mb-1 block text-sm" style={{ color: "var(--text-mut)" }}>
          Pitanje / zadatak
        </span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          required
          placeholder="Upiši pitanje ili opis zadatka..."
          className="input-field"
        />
      </label>

      <ImageUpload
        label="Slika / medij (opcionalno — koriste VISUAL_CLICK, PUZZLE, SPOT_DIFFERENCE-A, IMAGE/MULTIPLE_CHOICE itd.)"
        value={mediaUrl}
        onChange={setMediaUrl}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-sm" style={{ color: "var(--text-mut)" }}>Kategorija</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="input-field"
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
          <span className="mb-1 block text-sm" style={{ color: "var(--text-mut)" }}>Težina</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="input-field"
          >
            {Object.entries(DIFFICULTY_LABELS).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm" style={{ color: "var(--text-mut)" }}>Bodovi</span>
          <input
            type="number"
            min={1}
            max={1000}
            value={basePoints}
            onChange={(e) => setBasePoints(parseInt(e.target.value))}
            className="input-field"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm" style={{ color: "var(--text-mut)" }}>
            Vremenski limit (s)
          </span>
          <input
            type="number"
            min={5}
            max={300}
            value={timeLimitSec}
            onChange={(e) => setTimeLimitSec(parseInt(e.target.value))}
            className="input-field"
          />
        </label>
      </div>

      {/* Tip-specifični dio */}
      <div className="glass rounded-[var(--r-card)] p-5" style={{ border: "1px solid var(--border-hi)" }}>
        <p className="mb-4 text-sm font-semibold" style={{ color: "var(--powder)" }}>
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
            mediaUrl={mediaUrl || undefined}
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

      {err && <p className="text-sm" style={{ color: "var(--red)" }}>{err.message}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="btn-primary px-8 py-2.5 text-sm disabled:opacity-50">
          {busy ? "Spremanje..." : existing ? "Spremi izmjene" : "Kreiraj izazov"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary px-8 py-2.5 text-sm">
          Odustani
        </button>
      </div>
    </form>
  );
}
