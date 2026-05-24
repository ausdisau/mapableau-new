import { compare } from "bcryptjs";
import type { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { normalizeAuthProvider } from "@/lib/auth/auth-provider";
import {
  ensureProfileOnboarding,
  resolveOAuthSignIn,
} from "@/lib/auth/create-or-link-profile";
import { logAuthEvent } from "@/lib/audit/auth-audit-service";
import { buildOAuthProviders } from "@/lib/auth/oauth-providers";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    ...buildOAuthProviders(),
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
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") return true;

      if (account?.type !== "oauth" || !account.providerAccountId) {
        return true;
      }

      const email =
        user.email ??
        (typeof profile === "object" &&
        profile !== null &&
        "email" in profile &&
        typeof profile.email === "string"
          ? profile.email
          : null);

      if (!email) {
        await logAuthEvent({
          eventType: "login_failed",
          provider: normalizeAuthProvider(account.provider),
          metadata: { reason: "missing_email_from_provider" },
        });
        return false;
      }

      const name =
        user.name ??
        (typeof profile === "object" &&
        profile !== null &&
        "name" in profile &&
        typeof profile.name === "string"
          ? profile.name
          : email.split("@")[0]);

      const result = await resolveOAuthSignIn({
        nextAuthProviderId: account.provider,
        providerSubject: account.providerAccountId,
        email,
        name,
      });

      if (result.action === "deny") {
        await logAuthEvent({
          eventType: "login_failed",
          provider: normalizeAuthProvider(account.provider),
          metadata: { reason: result.reason },
        });
        return false;
      }

      if (result.action === "redirect") {
        return result.url;
      }

      user.id = result.userId;
      const dbUser = await prisma.user.findUnique({
        where: { id: result.userId },
      });
      if (dbUser) {
        user.email = dbUser.email;
        user.name = dbUser.name;
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.id = user.id;
      }

      const userId = (user?.id ?? token.id) as string | undefined;
      if (userId && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { primaryRole: true },
        });
        if (dbUser) {
          token.role = dbUser.primaryRole;
        }
      }

      if (account?.provider && account.provider !== "credentials") {
        token.authProvider = normalizeAuthProvider(account.provider);
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/auth/complete`;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (!user.id) return;
      await ensureProfileOnboarding(user.id);
      if (account?.provider === "credentials") {
        await logAuthEvent({
          eventType: "login_success",
          userId: user.id,
          provider: "credentials",
          metadata: { method: "credentials" },
        });
      }
    },
  },
};
