import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { hashPassword } from "~/server/auth/password";

export const authRouter = createTRPCRouter({
  /**
   * Registracija novog korisnika s emailom i lozinkom.
   * Validira ulaz, provjerava duplikat emaila, hashira lozinku.
   * Vraća korisnika BEZ password polja.
   */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Ime mora imati najmanje 2 znaka."),
        email: z.string().email("Neispravna email adresa."),
        password: z
          .string()
          .min(8, "Lozinka mora imati najmanje 8 znakova.")
          .max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });

      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Korisnik s tom email adresom već postoji.",
        });
      }

      const hashed = await hashPassword(input.password);

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashed,
          role: "PLAYER",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          // password NIKAD ne vraćamo klijentu
        },
      });

      return user;
    }),
});
