import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [aggregate, answers, roomPlayers] = await Promise.all([
      ctx.db.gameSession.aggregate({
        where: { userId, status: "FINISHED" },
        _sum: { totalScore: true },
        _count: { id: true },
        _max: { totalScore: true },
      }),
      ctx.db.answerRecord.findMany({
        where: { userId },
        select: { gameSessionId: true, isCorrect: true, answeredAt: true },
        orderBy: { answeredAt: "asc" },
      }),
      ctx.db.roomPlayer.findMany({
        where: { userId },
        select: {
          finalScore: true,
          room: {
            select: {
              status: true,
              players: { select: { finalScore: true } },
            },
          },
        },
      }),
    ]);

    const totalPoints = aggregate._sum.totalScore ?? 0;
    const sessionsPlayed = aggregate._count.id;
    const bestScore = aggregate._max.totalScore ?? 0;

    // Win rate — multiplayer sobe gdje je igrač bio na 1. mjestu (izjednačenje se broji)
    const finishedRooms = roomPlayers.filter((rp) => rp.room.status === "FINISHED");
    let winRate: number | null = null;
    if (finishedRooms.length > 0) {
      const wins = finishedRooms.filter((rp) => {
        const maxScore = Math.max(...rp.room.players.map((p) => p.finalScore));
        return rp.finalScore >= maxScore;
      }).length;
      winRate = wins / finishedRooms.length;
    }

    // Streak rekord — najdulji niz uzastopnih točnih odgovora unutar iste sesije
    const bySession = new Map<string, boolean[]>();
    for (const a of answers) {
      const list = bySession.get(a.gameSessionId) ?? [];
      list.push(a.isCorrect);
      bySession.set(a.gameSessionId, list);
    }

    let streakRecord = 0;
    for (const sessionAnswers of bySession.values()) {
      let cur = 0;
      for (const isCorrect of sessionAnswers) {
        if (isCorrect) {
          cur++;
          if (cur > streakRecord) streakRecord = cur;
        } else {
          cur = 0;
        }
      }
    }

    // Prosječna točnost
    const totalAnswers = answers.length;
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const accuracy: number | null =
      totalAnswers > 0 ? correctAnswers / totalAnswers : null;

    return {
      totalPoints,
      sessionsPlayed,
      bestScore,
      winRate,
      streakRecord,
      accuracy,
    };
  }),
});
