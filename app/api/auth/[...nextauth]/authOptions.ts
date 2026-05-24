import { compare } from "bcryptjs";
import type { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { buildOAuthProviders } from "@/lib/auth/oauth-providers";
import { findOrCreateOAuthUser } from "@/lib/auth/oauth-user";
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

      if (account?.type !== "oauth") return true;

      const email =
        user.email ??
        (typeof profile === "object" &&
        profile !== null &&
        "email" in profile &&
        typeof profile.email === "string"
          ? profile.email
          : null);

      if (!email) return false;

      const name =
        user.name ??
        (typeof profile === "object" &&
        profile !== null &&
        "name" in profile &&
        typeof profile.name === "string"
          ? profile.name
          : email.split("@")[0]);

      const dbUser = await findOrCreateOAuthUser({ email, name });
      user.id = dbUser.id;
      user.email = dbUser.email;
      user.name = dbUser.name;
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
        token.authProvider = account.provider;
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
  },
};
