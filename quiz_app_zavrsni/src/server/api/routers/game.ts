import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { ChallengeType, Difficulty } from "../../../../generated/prisma";
import type { Prisma } from "../../../../generated/prisma";

// Ukloni correctAnswer prije slanja klijentu — server je autoritativan
function sanitize<T extends { correctAnswer: unknown }>(ch: T) {
  const { correctAnswer: _stripped, ...safe } = ch;
  return safe;
}

// Validacija odgovora — radi samo server, klijent ne zna correctAnswer
function validateAnswer(
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

// Bodovi = bazni + vremenski bonus (do 50%) × streak multiplikator × težina
function calcPoints(
  base: number,
  limitSec: number,
  difficulty: Difficulty,
  takenMs: number,
  streak: number,
): number {
  const timeRatio = Math.max(0, 1 - takenMs / (limitSec * 1000));
  const timeBonus = Math.floor(base * timeRatio * 0.5);
  const streakMult = Math.min(1 + streak * 0.1, 2.0); // max 2× pri 10+ streak
  const diffMult =
    difficulty === "EASY" ? 1 : difficulty === "MEDIUM" ? 1.25 : 1.5;
  return Math.floor((base + timeBonus) * streakMult * diffMult);
}

// Broji uzastopne točne odgovore (odgovori poredani desc)
function calcStreak(answers: { isCorrect: boolean }[]) {
  let n = 0;
  for (const a of answers) {
    if (a.isCorrect) n++;
    else break;
  }
  return n;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const gameRouter = createTRPCRouter({
  // Popis objavljenih kvizova za odabir
  listQuizzes: publicProcedure.query(({ ctx }) =>
    ctx.db.quiz.findMany({
      where: { isPublished: true },
      include: {
        category: { select: { name: true } },
        _count: { select: { quizChallenges: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ),

  // Pokreni novu solo sesiju — vrati prvi izazov (bez correctAnswer)
  startSession: protectedProcedure
    .input(z.object({ quizId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const quiz = await ctx.db.quiz.findUnique({
        where: { id: input.quizId, isPublished: true },
        include: {
          quizChallenges: {
            include: { challenge: true },
            orderBy: { order: "asc" },
          },
        },
      });
      if (!quiz)
        throw new TRPCError({ code: "NOT_FOUND", message: "Kviz nije pronađen." });
      if (quiz.quizChallenges.length === 0)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kviz nema izazova." });

      const session = await ctx.db.gameSession.create({
        data: {
          userId: ctx.session.user.id,
          quizId: input.quizId,
          mode: "SOLO",
          status: "IN_PROGRESS",
        },
      });

      const firstQC = quiz.quizChallenges[0]!;
      return {
        sessionId: session.id,
        challenge: sanitize(firstQC.challenge),
        challengeIndex: 0,
        totalChallenges: quiz.quizChallenges.length,
        quizTitle: quiz.title,
      };
    }),

  // Dohvati stanje sesije — za refresh ili reconnect
  getSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
        include: {
          quiz: {
            include: {
              quizChallenges: {
                include: { challenge: true },
                orderBy: { order: "asc" },
              },
            },
          },
          answers: { select: { challengeId: true } },
        },
      });
      if (!session || session.userId !== ctx.session.user.id)
        throw new TRPCError({ code: "NOT_FOUND" });

      if (session.status === "FINISHED") {
        return {
          status: "FINISHED" as const,
          totalScore: session.totalScore,
          quizTitle: session.quiz.title,
        };
      }

      const answeredIds = new Set(session.answers.map((a) => a.challengeId));
      const challenges = session.quiz.quizChallenges;
      const idx = challenges.findIndex((qc) => !answeredIds.has(qc.challengeId));

      if (idx === -1) {
        await ctx.db.gameSession.update({
          where: { id: input.sessionId },
          data: { status: "FINISHED", finishedAt: new Date() },
        });
        return {
          status: "FINISHED" as const,
          totalScore: session.totalScore,
          quizTitle: session.quiz.title,
        };
      }

      const current = challenges[idx]!;
      return {
        status: "IN_PROGRESS" as const,
        challenge: sanitize(current.challenge),
        challengeIndex: idx,
        totalChallenges: challenges.length,
        totalScore: session.totalScore,
        quizTitle: session.quiz.title,
      };
    }),

  // Primi odgovor → validiraj → izračunaj bodove → vrati sljedeći izazov
  submitAnswer: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        challengeId: z.string(),
        givenAnswer: z.record(z.string(), z.unknown()),
        timeTakenMs: z.number().int().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
        include: {
          quiz: {
            include: {
              quizChallenges: {
                include: { challenge: true },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      });
      if (!session || session.userId !== ctx.session.user.id)
        throw new TRPCError({ code: "NOT_FOUND" });
      if (session.status !== "IN_PROGRESS")
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sesija nije aktivna." });

      const qc = session.quiz.quizChallenges.find(
        (q) => q.challengeId === input.challengeId,
      );
      if (!qc)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Izazov nije dio ovog kviza.",
        });

      const alreadyAnswered = await ctx.db.answerRecord.findFirst({
        where: { gameSessionId: input.sessionId, challengeId: input.challengeId },
        select: { id: true },
      });
      if (alreadyAnswered)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Već odgovoreno." });

      const ch = qc.challenge;
      const isCorrect = validateAnswer(ch.type, ch.correctAnswer, input.givenAnswer);

      // Streak = broj uzastopnih točnih odgovora u ovoj sesiji
      const recentAnswers = await ctx.db.answerRecord.findMany({
        where: { gameSessionId: input.sessionId },
        orderBy: { answeredAt: "desc" },
        select: { isCorrect: true },
      });
      const streak = calcStreak(recentAnswers);

      // Vremenski limit — ne vjeruj klijentu da je brži od mogućeg
      const safeTakenMs = Math.min(input.timeTakenMs, ch.timeLimitSec * 1000);
      const pointsAwarded = isCorrect
        ? calcPoints(ch.basePoints, ch.timeLimitSec, ch.difficulty, safeTakenMs, streak)
        : 0;

      await ctx.db.$transaction([
        ctx.db.answerRecord.create({
          data: {
            gameSessionId: input.sessionId,
            challengeId: input.challengeId,
            userId: ctx.session.user.id,
            givenAnswer: input.givenAnswer as Prisma.InputJsonValue,
            isCorrect,
            pointsAwarded,
            timeTakenMs: safeTakenMs,
          },
        }),
        ctx.db.gameSession.update({
          where: { id: input.sessionId },
          data: { totalScore: { increment: pointsAwarded } },
        }),
      ]);

      const challenges = session.quiz.quizChallenges;
      const currentIdx = challenges.findIndex(
        (q) => q.challengeId === input.challengeId,
      );
      const nextQC = challenges[currentIdx + 1];

      if (!nextQC) {
        await ctx.db.gameSession.update({
          where: { id: input.sessionId },
          data: { status: "FINISHED", finishedAt: new Date() },
        });
        return {
          isCorrect,
          pointsAwarded,
          newTotalScore: session.totalScore + pointsAwarded,
          streak: isCorrect ? streak + 1 : 0,
          nextChallenge: null as null,
          nextIndex: null as null,
          gameFinished: true as const,
        };
      }

      return {
        isCorrect,
        pointsAwarded,
        newTotalScore: session.totalScore + pointsAwarded,
        streak: isCorrect ? streak + 1 : 0,
        nextChallenge: sanitize(nextQC.challenge),
        nextIndex: currentIdx + 1,
        gameFinished: false as const,
      };
    }),

  // Rezultati završene sesije s raščlambom po odgovorima
  getResults: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
        include: {
          quiz: { select: { id: true, title: true } },
          answers: {
            include: {
              challenge: {
                select: {
                  prompt: true,
                  type: true,
                  basePoints: true,
                  timeLimitSec: true,
                },
              },
            },
            orderBy: { answeredAt: "asc" },
          },
        },
      });
      if (!session || session.userId !== ctx.session.user.id)
        throw new TRPCError({ code: "NOT_FOUND" });
      return session;
    }),
});
