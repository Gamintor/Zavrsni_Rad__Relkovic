"use client";

import { useEffect, useRef, useState } from "react";

interface Pair { id: string; front: string; back: string; }
interface Card { cardId: string; pairId: string; text: string; isFlipped: boolean; isMatched: boolean; }
interface Props { pairs: Pair[]; onSubmit: (answer: Record<string, unknown>) => void; disabled: boolean; }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function buildCards(pairs: Pair[]): Card[] {
  return shuffle(
    pairs.flatMap((p) => [
      { cardId: `${p.id}-A`, pairId: p.id, text: p.front, isFlipped: false, isMatched: false },
      { cardId: `${p.id}-B`, pairId: p.id, text: p.back,  isFlipped: false, isMatched: false },
    ]),
  );
}

export default function Memory({ pairs, onSubmit, disabled }: Props) {
  const [cards, setCards] = useState<Card[]>(() => buildCards(pairs));
  const [checking, setChecking] = useState(false);
  const [firstIdx, setFirstIdx] = useState<number | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!submittedRef.current && cards.length > 0 && cards.every((c) => c.isMatched)) {
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
      setCards((prev) => prev.map((c, i) => (i === idx ? { ...c, isFlipped: true } : c)));
      setFirstIdx(idx);
      return;
    }

    const first = cards[firstIdx];
    if (!first) return;

    const newCards = cards.map((c, i) => i === idx ? { ...c, isFlipped: true } : c);
    setCards(newCards);
    setFirstIdx(null);

    if (first.pairId === card.pairId) {
      setCards((prev) => prev.map((c, i) => (i === idx || i === firstIdx ? { ...c, isFlipped: true, isMatched: true } : c)));
    } else {
      setChecking(true);
      const capturedFirst = firstIdx;
      setTimeout(() => {
        setCards((prev) => prev.map((c, i) => (i === idx || i === capturedFirst ? { ...c, isFlipped: false } : c)));
        setChecking(false);
      }, 1000);
    }
  }

  const matchedCount = cards.filter((c) => c.isMatched).length / 2;
  const totalPairs = pairs.length;
  const cols = totalPairs <= 3 ? totalPairs * 2 : 4;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: "var(--text-mut)" }}>Klikni dvije kartice da pronađeš par</span>
        <span className="font-bold text-powder">{matchedCount} / {totalPairs} parova</span>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {cards.map((card, idx) => (
          <div
            key={card.cardId}
            onClick={() => handleCardClick(idx)}
            className={`relative flex min-h-20 cursor-pointer items-center justify-center rounded-[var(--r-md)] p-2 text-center text-sm font-medium transition-all duration-300 ${disabled ? "cursor-default" : ""}`}
            style={
              card.isMatched
                ? { border: "1px solid rgba(42,157,143,0.6)", background: "rgba(42,157,143,0.1)", color: "var(--green)", cursor: "default" }
                : card.isFlipped
                ? { border: "1px solid rgba(230,57,70,0.5)", background: "rgba(230,57,70,0.1)", color: "var(--cream)" }
                : { border: "1px solid var(--border-soft)", background: "var(--glass-strong)", color: "transparent" }
            }
          >
            {card.isFlipped || card.isMatched ? (
              card.text
            ) : (
              <span className="text-2xl" style={{ color: "var(--text-mut)" }}>?</span>
            )}
            {card.isMatched && <div className="absolute right-1 top-1 text-xs text-green">✓</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
