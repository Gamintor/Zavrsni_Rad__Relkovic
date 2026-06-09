import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "~/server/api/routers/user";

export const appRouter = createTRPCRouter({
  user: userRouter,
  // content: contentRouter,  (korak 2 — admin CRUD)
  // game: gameRouter,        (korak 3 — solo igra)
  // leaderboard: leaderboardRouter,
  // room: roomRouter,        (korak 5 — multiplayer)
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
