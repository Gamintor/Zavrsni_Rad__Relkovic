import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/authRouter";
import { contentRouter } from "~/server/api/routers/content";
import { gameRouter } from "~/server/api/routers/game";
import { leaderboardRouter } from "~/server/api/routers/leaderboard";
import { userRouter } from "~/server/api/routers/user";
import { roomRouter } from "~/server/api/routers/roomRouter";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  content: contentRouter,
  game: gameRouter,
  leaderboard: leaderboardRouter,
  room: roomRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
