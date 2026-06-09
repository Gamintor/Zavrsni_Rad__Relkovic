import { type DefaultSession, type NextAuthConfig, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { db } from "~/server/db";
import { verifyPassword } from "~/server/auth/password";
import { type Role } from "../../../generated/prisma";

// ─── TypeScript module augmentation ───────────────────────────────────────────
// Auth.js v5 beta — augmentiramo samo "next-auth" (ne "next-auth/jwt" koji ne postoji u beti)

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
  }
}

// ─── Validation schema used inside authorize ──────────────────────────────────

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Auth.js v5 config ────────────────────────────────────────────────────────

export const authConfig = {
  // JWT strategija je OBAVEZNA za Credentials provider (ne radi s database sesijama)
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Lozinka", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            password: true, // potreban za verifikaciju, ne vraćamo klijentu
          },
        });

        if (!user?.password) return null;

        const valid = await verifyPassword(parsed.data.password, user.password);
        if (!valid) return null;

        // password nije u returnu — JWT token ga nikad neće sadržavati
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    // jwt callback: na prvom sign-inu user objekt je dostupan — kopiramo id i role u token
    // JWT type u v5 beti extends Record<string, unknown> pa možemo dodavati custom polja
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user.role ?? "PLAYER") as Role;
      }
      return token;
    },

    // session callback: token.id i token.role su unknown jer nema JWT augmentacije u beti
    // → explicit castevi su sigurni jer smo ih sami postavili u jwt callbacku iznad
    session({ session, token }): Session {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as Role,
        },
      };
    },
  },

  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
