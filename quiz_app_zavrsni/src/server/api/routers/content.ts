import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { ChallengeType, Difficulty } from "../../../../generated/prisma";
import type { Prisma } from "../../../../generated/prisma";

// JSON objekt — content i correctAnswer su uvijek objekti, ne primitivi
const jsonObjSchema = z.record(z.string(), z.unknown());
type JsonObj = z.infer<typeof jsonObjSchema>;
const toJson = (v: JsonObj) => v as Prisma.InputJsonValue;

// ─── Category ────────────────────────────────────────────────────────────────

const categoryRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { challenges: true, quizzes: true } } },
    }),
  ),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z
          .string()
          .min(1)
          .max(100)
          .regex(/^[a-z0-9-]+$/, "Samo mala slova, brojevi i crtice"),
        description: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => ctx.db.category.create({ data: input })),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        slug: z
          .string()
          .min(1)
          .max(100)
          .regex(/^[a-z0-9-]+$/)
          .optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.category.update({ where: { id }, data });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.category.delete({ where: { id: input.id } }),
    ),
});

// ─── Challenge ───────────────────────────────────────────────────────────────

const challengeBaseInput = z.object({
  type: z.nativeEnum(ChallengeType),
  prompt: z.string().min(1),
  content: jsonObjSchema,
  correctAnswer: jsonObjSchema,
  mediaUrl: z.string().url().or(z.literal("")).nullable().optional(),
  difficulty: z.nativeEnum(Difficulty),
  basePoints: z.number().int().min(1).max(1000),
  timeLimitSec: z.number().int().min(5).max(300),
  categoryId: z.string(),
});

const challengeRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z
        .object({
          categoryId: z.string().optional(),
          type: z.nativeEnum(ChallengeType).optional(),
          difficulty: z.nativeEnum(Difficulty).optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) =>
      ctx.db.challenge.findMany({
        where: {
          categoryId: input?.categoryId,
          type: input?.type,
          difficulty: input?.difficulty,
        },
        include: {
          category: { select: { name: true } },
          _count: { select: { quizChallenges: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const ch = await ctx.db.challenge.findUnique({
        where: { id: input.id },
        include: { category: { select: { id: true, name: true } } },
      });
      if (!ch) throw new TRPCError({ code: "NOT_FOUND" });
      return ch;
    }),

  create: adminProcedure
    .input(challengeBaseInput)
    .mutation(({ ctx, input }) =>
      ctx.db.challenge.create({
        data: {
          ...input,
          content: toJson(input.content),
          correctAnswer: toJson(input.correctAnswer),
          mediaUrl: input.mediaUrl || null,
          createdById: ctx.session.user.id,
        },
      }),
    ),

  update: adminProcedure
    .input(challengeBaseInput.partial().extend({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      const { id, content, correctAnswer, ...rest } = input;
      return ctx.db.challenge.update({
        where: { id },
        data: {
          ...rest,
          ...(content !== undefined && { content: toJson(content) }),
          ...(correctAnswer !== undefined && {
            correctAnswer: toJson(correctAnswer),
          }),
          mediaUrl: rest.mediaUrl ?? undefined,
        },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.challenge.delete({ where: { id: input.id } }),
    ),
});

// ─── Quiz ─────────────────────────────────────────────────────────────────────

const quizRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db.quiz.findMany({
      include: {
        categories: { select: { name: true } },
        createdBy: { select: { name: true } },
        _count: { select: { quizChallenges: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const quiz = await ctx.db.quiz.findUnique({
        where: { id: input.id },
        include: {
          categories: { select: { id: true, name: true } },
          quizChallenges: {
            include: {
              challenge: {
                select: {
                  id: true,
                  prompt: true,
                  type: true,
                  difficulty: true,
                  basePoints: true,
                  timeLimitSec: true,
                  category: { select: { name: true } },
                },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      });
      if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });
      return quiz;
    }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        categoryIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { categoryIds, ...rest } = input;
      return ctx.db.quiz.create({
        data: {
          ...rest,
          createdById: ctx.session.user.id,
          ...(categoryIds?.length && {
            categories: { connect: categoryIds.map((id) => ({ id })) },
          }),
        },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().nullable().optional(),
        categoryIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, categoryIds, ...rest } = input;
      return ctx.db.quiz.update({
        where: { id },
        data: {
          ...rest,
          ...(categoryIds !== undefined && {
            categories: { set: categoryIds.map((cid) => ({ id: cid })) },
          }),
        },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.quiz.delete({ where: { id: input.id } }),
    ),

  togglePublish: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const quiz = await ctx.db.quiz.findUnique({
        where: { id: input.id },
        select: { isPublished: true },
      });
      if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.quiz.update({
        where: { id: input.id },
        data: { isPublished: !quiz.isPublished },
      });
    }),

  addChallenge: adminProcedure
    .input(z.object({ quizId: z.string(), challengeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const max = await ctx.db.quizChallenge.aggregate({
        where: { quizId: input.quizId },
        _max: { order: true },
      });
      return ctx.db.quizChallenge.create({
        data: {
          quizId: input.quizId,
          challengeId: input.challengeId,
          order: (max._max.order ?? -1) + 1,
        },
      });
    }),

  removeChallenge: adminProcedure
    .input(z.object({ quizId: z.string(), challengeId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.quizChallenge.deleteMany({
        where: { quizId: input.quizId, challengeId: input.challengeId },
      }),
    ),

  reorderChallenges: adminProcedure
    .input(
      z.object({
        quizId: z.string(),
        order: z.array(
          z.object({ challengeId: z.string(), order: z.number().int().min(0) }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.order.map(({ challengeId, order }) =>
          ctx.db.quizChallenge.updateMany({
            where: { quizId: input.quizId, challengeId },
            data: { order },
          }),
        ),
      );
    }),
});

// ─── Export ───────────────────────────────────────────────────────────────────

export const contentRouter = createTRPCRouter({
  category: categoryRouter,
  challenge: challengeRouter,
  quiz: quizRouter,
});
