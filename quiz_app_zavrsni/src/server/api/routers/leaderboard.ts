import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

// Zadržava samo najbolji rezultat po korisniku
function bestPerUser<T extends { userId: string; totalScore: number }>(
  sessions: T[],
  limit: number,
): T[] {
  const best = new Map<string, T>();
  for (const s of sessions) {
    const ex = best.get(s.userId);
    if (!ex || s.totalScore > ex.totalScore) best.set(s.userId, s);
  }
  return Array.from(best.values())
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);
}

export const leaderboardRouter = createTRPCRouter({
  // Globalna ljestvica — najboljizrezultat po korisniku (iz svih kvizova)
  global: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.db.gameSession.findMany({
        where: { status: "FINISHED", mode: "SOLO" },
        include: {
          user: { select: { name: true, image: true } },
          quiz: { select: { title: true } },
        },
        orderBy: { totalScore: "desc" },
      });
      return bestPerUser(sessions, input.limit);
    }),

  // Ljestvica za konkretan kviz — za prikaz na stranici rezultata
  byQuiz: publicProcedure
    .input(
      z.object({
        quizId: z.string(),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.db.gameSession.findMany({
        where: {
          quizId: input.quizId,
          status: "FINISHED",
          mode: "SOLO",
        },
        include: {
          user: { select: { name: true, image: true } },
        },
        orderBy: { totalScore: "desc" },
      });
      return bestPerUser(sessions, input.limit);
    }),

  // Osobna povijest igranja (solo i multiplayer)
  myHistory: protectedProcedure.query(({ ctx }) =>
    ctx.db.gameSession.findMany({
      where: { userId: ctx.session.user.id, status: "FINISHED" },
      include: {
        quiz: { select: { title: true } },
        answers: { select: { isCorrect: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 30,
    }),
  ),
});
