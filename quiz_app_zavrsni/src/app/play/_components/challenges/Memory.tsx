"use client";

import { useEffect, useRef, useState } from "react";

interface Pair {
  id: string;
  front: string;
  back: string;
}

interface Card {
  cardId: string;
  pairId: string;
  text: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Props {
  pairs: Pair[];
  onSubmit: (answer: Record<string, unknown>) => void;
  disabled: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

function buildCards(pairs: Pair[]): Card[] {
  return shuffle(
    pairs.flatMap((p) => [
      { cardId: `${p.id}-A`, pairId: p.id, text: p.front, isFlipped: false, isMatched: false },
      { cardId: `${p.id}-B`, pairId: p.id, text: p.back, isFlipped: false, isMatched: false },
    ]),
  );
}

export default function Memory({ pairs, onSubmit, disabled }: Props) {
  const [cards, setCards] = useState<Card[]>(() => buildCards(pairs));
  const [checking, setChecking] = useState(false);
  const [firstIdx, setFirstIdx] = useState<number | null>(null);
  const submittedRef = useRef(false);

  // Auto-submit kad su sve kartice uparene
  useEffect(() => {
    if (
      !submittedRef.current &&
      cards.length > 0 &&
      cards.every((c) => c.isMatched)
    ) {
      submittedRef.current = true;
      const t = setTimeout(() => onSubmit({ allMatched: true }), 600);
      return () => clearTimeout(t);
    }
  }, [cards, onSubmit]);

  function handleCardClick(idx: number) {
    if (disabled || checking) return;
    const card = cards[idx];
    if (!card || card.isFlipped || card.isMatched) return;

    if (firstIdx === null) {
      // Prva karta — preokreni je
      setCards((prev) =>
        prev.map((c, i) => (i === idx ? { ...c, isFlipped: true } : c)),
      );
      setFirstIdx(idx);
      return;
    }

    // Druga karta — preokreni i provjeri
    const first = cards[firstIdx];
    if (!first) return;

    const newCards = cards.map((c, i) =>
      i === idx ? { ...c, isFlipped: true } : c,
    );
    setCards(newCards);
    setFirstIdx(null);

    if (first.pairId === card.pairId) {
      // Par je pronađen!
      setCards((prev) =>
        prev.map((c, i) =>
          i === idx || i === firstIdx ? { ...c, isFlipped: true, isMatched: true } : c,
        ),
      );
    } else {
      // Nije par — preokreni nazad nakon kratke pauze
      setChecking(true);
      const capturedFirst = firstIdx;
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c, i) =>
            i === idx || i === capturedFirst ? { ...c, isFlipped: false } : c,
          ),
        );
        setChecking(false);
      }, 1000);
    }
  }

  const matchedCount = cards.filter((c) => c.isMatched).length / 2;
  const totalPairs = pairs.length;

  // Broj stupaca ovisno o količini parova
  const cols = totalPairs <= 3 ? totalPairs * 2 : 4;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-white/60">
        <span>Klikni dvije kartice da pronađeš par</span>
        <span className="text-[hsl(280,100%,70%)]">
          {matchedCount} / {totalPairs} parova
        </span>
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cards.map((card, idx) => (
          <div
            key={card.cardId}
            onClick={() => handleCardClick(idx)}
            className={`relative flex min-h-20 cursor-pointer items-center justify-center rounded-xl border-2 p-2 text-center text-sm font-medium transition-all duration-300 ${
              card.isMatched
                ? "border-green-500/60 bg-green-500/10 text-green-300 cursor-default"
                : card.isFlipped
                  ? "border-[hsl(280,100%,70%)]/60 bg-[hsl(280,100%,70%)]/10 text-white"
                  : "border-white/20 bg-white/5 text-white/0 hover:border-white/40 hover:bg-white/10"
            } ${disabled ? "cursor-default" : ""}`}
          >
            {card.isFlipped || card.isMatched ? (
              card.text
            ) : (
              <span className="text-2xl text-white/30">?</span>
            )}
            {card.isMatched && (
              <div className="absolute right-1 top-1 text-xs text-green-400">✓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
