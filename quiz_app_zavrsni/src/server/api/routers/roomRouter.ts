import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

type Db = typeof db;

function generateCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function uniqueCode(prisma: Db): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    const exists = await prisma.room.findUnique({ where: { code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error("Ne može generirati jedinstveni kod sobe.");
}

const userSelect = { id: true, name: true, image: true } as const;

export const roomRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ quizId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const quiz = await ctx.db.quiz.findUnique({
        where: { id: input.quizId, isPublished: true },
        select: { id: true },
      });
      if (!quiz)
        throw new TRPCError({ code: "NOT_FOUND", message: "Kviz nije pronađen." });

      const code = await uniqueCode(ctx.db);

      const room = await ctx.db.room.create({
        data: { code, hostId: ctx.session.user.id, quizId: input.quizId, status: "LOBBY" },
      });
      await ctx.db.roomPlayer.create({
        data: { roomId: room.id, userId: ctx.session.user.id },
      });

      return { code };
    }),

  join: protectedProcedure
    .input(z.object({ code: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.db.room.findUnique({
        where: { code: input.code.toUpperCase() },
        include: { quiz: { select: { title: true } } },
      });
      if (!room)
        throw new TRPCError({ code: "NOT_FOUND", message: "Soba nije pronađena." });
      if (room.status !== "LOBBY")
        throw new TRPCError({ code: "BAD_REQUEST", message: "Igra je već u tijeku ili završena." });

      await ctx.db.roomPlayer.upsert({
        where: { roomId_userId: { roomId: room.id, userId: ctx.session.user.id } },
        create: { roomId: room.id, userId: ctx.session.user.id },
        update: {},
      });

      return { code: room.code, quizTitle: room.quiz.title, hostId: room.hostId };
    }),

  getByCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const room = await ctx.db.room.findUnique({
        where: { code: input.code.toUpperCase() },
        include: {
          quiz: { select: { id: true, title: true } },
          players: {
            include: { user: { select: userSelect } },
            orderBy: { joinedAt: "asc" },
          },
        },
      });
      if (!room)
        throw new TRPCError({ code: "NOT_FOUND", message: "Soba nije pronađena." });
      return room;
    }),

  leave: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.db.room.findUnique({
        where: { code: input.code },
        select: { id: true },
      });
      if (!room) return;
      await ctx.db.roomPlayer.deleteMany({
        where: { roomId: room.id, userId: ctx.session.user.id },
      });
    }),
});
