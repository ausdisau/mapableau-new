import { compare } from "bcryptjs";
import type { AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";

import { agentLog } from "@/lib/debug/agent-log";
import {
  AUTH_SESSION_MAX_AGE_SECONDS,
  mergeJwtTokenIntoSession,
  mergeUserIntoJwtToken,
} from "@/lib/auth/nextauth-session";
import { ensureNextAuthEnv, resolveNextAuthSecret } from "@/lib/auth/nextauth-env";
import { prisma } from "@/lib/prisma";

ensureNextAuthEnv();

export const authOptions: AuthOptions = {
  secret: resolveNextAuthSecret(),
  session: {
    strategy: "jwt",
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    updateAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
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
        // #region agent log
        agentLog(
          "A",
          "authOptions.ts:authorize:entry",
          "authorize called",
          {
            hasEmail: Boolean(credentials?.email),
            hasPassword: Boolean(credentials?.password),
          }
        );
        // #endregion

        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password.trim();

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            // #region agent log
            agentLog(
              "A",
              "authOptions.ts:authorize:noUser",
              "user not found",
              {
                emailDomain: email.split("@")[1] ?? null,
              }
            );
            // #endregion
            return null;
          }

          const valid = await compare(password, user.passwordHash);
          if (!valid) {
            // #region agent log
            agentLog(
              "A",
              "authOptions.ts:authorize:badPassword",
              "password mismatch",
              { userId: user.id }
            );
            // #endregion
            return null;
          }

          // #region agent log
          agentLog(
            "A",
            "authOptions.ts:authorize:success",
            "authorize success",
            { userId: user.id, primaryRole: user.primaryRole }
          );
          // #endregion

          return {
            id: user.id,
            email: user.email ?? null,
            name: user.name ?? null,
            role: user.primaryRole,
          };
        } catch (error) {
          console.error("[auth] authorize failed", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        mergeUserIntoJwtToken(token as Record<string, unknown>, {
          id: user.id,
          email: user.email,
          name: user.name,
          role: (user as { role?: string }).role ?? null,
        });
        // #region agent log
        agentLog("B", "authOptions.ts:jwt", "jwt user merged", {
          userId: user.id,
          role: (user as { role?: string }).role ?? null,
          hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
          nextAuthUrl: process.env.NEXTAUTH_URL ?? null,
        });
        // #endregion
      }
      return token as JWT;
    },
    session({ session, token }) {
      return mergeJwtTokenIntoSession(
        session as { user?: Record<string, unknown> },
        token as Record<string, unknown>
      ) as typeof session;
    },
  },
};
