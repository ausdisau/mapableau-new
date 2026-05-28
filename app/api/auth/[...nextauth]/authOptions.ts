import { compare } from "bcryptjs";
import type { AuthOptions } from "next-auth";
import Auth0Provider from "next-auth/providers/auth0";
import Credentials from "next-auth/providers/credentials";

import {
  isAuth0ProviderConfigured,
  resolveAuth0Issuer,
} from "@/lib/auth/auth0-config";
import { findOrCreateUserFromOAuth } from "@/lib/auth/oauth-user";
import { resolveNextAuthSecret } from "@/lib/auth/resolve-nextauth-secret";
import { prisma } from "@/lib/prisma";

const credentialsProvider = Credentials({
  id: "credentials",
  name: "credentials",
  credentials: {
    email: { type: "email" },
    password: { type: "password" },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) return null;

    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (!user) return null;

    const valid = await compare(credentials.password, user.passwordHash);
    if (!valid) return null;

    return {
      id: user.id,
      email: user.email ?? null,
      name: user.name ?? null,
      role: user.primaryRole,
    };
  },
});

function auth0Provider() {
  const issuer = resolveAuth0Issuer();
  if (!issuer) {
    throw new Error("AUTH0_ISSUER or AUTH0_DOMAIN is required when Auth0 is enabled");
  }
  return Auth0Provider({
    clientId: process.env.AUTH0_CLIENT_ID!,
    clientSecret: process.env.AUTH0_CLIENT_SECRET!,
    issuer,
  });
}

export const authOptions: AuthOptions = {
  secret: resolveNextAuthSecret(),
  session: {
    strategy: "jwt",
  },
  providers: isAuth0ProviderConfigured()
    ? [credentialsProvider, auth0Provider()]
    : [credentialsProvider],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "auth0") return true;

      const email =
        user.email ??
        (typeof profile?.email === "string" ? profile.email : undefined);
      if (!email) return false;

      const dbUser = await findOrCreateUserFromOAuth({
        email,
        name: user.name ?? email,
      });

      user.id = dbUser.id;
      user.email = dbUser.email;
      user.name = dbUser.name;
      (user as { role?: string }).role = dbUser.primaryRole;

      return true;
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
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
