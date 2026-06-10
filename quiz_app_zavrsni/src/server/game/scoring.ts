import type { ChallengeType, Difficulty } from "../../../generated/prisma";
import type { Prisma } from "../../../generated/prisma";

export function validateAnswer(
  type: ChallengeType,
  correct: Prisma.JsonValue,
  given: Record<string, unknown>,
): boolean {
  const ca = correct as Record<string, unknown>;
  switch (type) {
    case "MULTIPLE_CHOICE": {
      const cs = new Set((ca.indices as number[]) ?? []);
      const gs = new Set((given.indices as number[]) ?? []);
      if (cs.size !== gs.size) return false;
      for (const v of cs) if (!gs.has(v)) return false;
      return true;
    }
    case "TRUE_FALSE":
      return (given.value as boolean) === (ca.value as boolean);
    case "TEXT_INPUT": {
      const ct = ((ca.text as string) ?? "").trim();
      const gt = ((given.text as string) ?? "").trim();
      return ca.caseSensitive ? ct === gt : ct.toLowerCase() === gt.toLowerCase();
    }
    case "VISUAL_CLICK": {
      const dx = (given.x as number) - (ca.x as number);
      const dy = (given.y as number) - (ca.y as number);
      return Math.sqrt(dx * dx + dy * dy) <= (ca.tolerance as number);
    }
    case "SPOT_DIFFERENCE": {
      const required =
        (ca.differences as { x: number; y: number; radius: number }[]) ?? [];
      const found = (given.found as { x: number; y: number }[]) ?? [];
      return required.every((d) =>
        found.some((f) => {
          const dx = f.x - d.x,
            dy = f.y - d.y;
          return Math.sqrt(dx * dx + dy * dy) <= d.radius;
        }),
      );
    }
    case "IMAGE_ORDER":
    case "SEQUENCE": {
      const co = ca.order as number[];
      const go = given.order as number[];
      return (
        Array.isArray(co) &&
        Array.isArray(go) &&
        co.length === go.length &&
        co.every((v, i) => go[i] === v)
      );
    }
    case "PUZZLE":
      return !!(given.solved);
    case "MEMORY":
      return !!(given.allMatched);
    default: {
      const _e: never = type;
      return false;
    }
  }
}

export interface ScoreParams {
  basePoints: number;
  timeLimitSec: number;
  difficulty: Difficulty;
  timeTakenMs: number;
  streak: number;
}

export function calculateScore(p: ScoreParams): number {
  const timeRatio = Math.max(0, 1 - p.timeTakenMs / (p.timeLimitSec * 1000));
  const timeBonus = Math.floor(p.basePoints * timeRatio * 0.5);
  const streakMult = Math.min(1 + p.streak * 0.1, 2.0);
  const diffMult =
    p.difficulty === "EASY" ? 1 : p.difficulty === "MEDIUM" ? 1.25 : 1.5;
  return Math.floor((p.basePoints + timeBonus) * streakMult * diffMult);
}

export function calcStreak(answers: { isCorrect: boolean }[]): number {
  let n = 0;
  for (const a of answers) {
    if (a.isCorrect) n++;
    else break;
  }
  return n;
}
