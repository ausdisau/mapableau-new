import { compare } from "bcryptjs";
import type { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { applyMfaFlagsToToken } from "@/lib/auth/mfa-session";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
        });

        if (!user) return null;

        const valid = await compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email ?? null,
          name: user.name ?? null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { primaryRole: true },
        });
        if (dbUser) {
          token.role = dbUser.primaryRole;
          await applyMfaFlagsToToken(token, user.id, dbUser.primaryRole);
        }
      }

      if (trigger === "update" && session) {
        if (typeof session.mfaVerifiedAt === "number") {
          token.mfaVerifiedAt = session.mfaVerifiedAt;
          token.mfaPending = false;
        }
        if (typeof session.stepUpUntil === "number") {
          token.stepUpUntil = session.stepUpUntil;
        }
      }

      const userId = token.id as string | undefined;
      if (userId && token.role && trigger !== "update") {
        const totp = await prisma.mfaMethod.findFirst({
          where: {
            userId,
            type: "totp",
            enabledAt: { not: null },
            disabledAt: null,
          },
        });
        token.mfaEnrollmentRequired =
          (await import("@/lib/auth/mfa-policy")).roleRequiresMfaEnrollment(
            token.role as import("@prisma/client").MapAbleUserRole,
          ) && !totp;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.mfaPending = Boolean(token.mfaPending);
        session.user.mfaEnrollmentRequired = Boolean(token.mfaEnrollmentRequired);
        session.user.mfaVerifiedAt = token.mfaVerifiedAt as number | undefined;
        session.user.stepUpUntil = token.stepUpUntil as number | undefined;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
};
