import { compare } from "bcryptjs";
import type { AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";

import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import { ensureOAuthUser } from "@/lib/auth/ensure-oauth-user";
import {
  ensureNextAuthEnv,
  resolveNextAuthSecret,
} from "@/lib/auth/nextauth-env";
import {
  AUTH_SESSION_MAX_AGE_SECONDS,
  mergeJwtTokenIntoSession,
  mergeUserIntoJwtToken,
} from "@/lib/auth/nextauth-session";
import { buildOAuthProviders } from "@/lib/auth/oauth-providers";
import {
  refreshWorkOSAuthKitToken,
  WORKOS_AUTHKIT_PROVIDER_ID,
  type WorkOSAuthKitProfile,
} from "@/lib/auth/workos-authkit-provider";
import { resolveAndLinkWorkOSIdentity } from "@/lib/auth/workos-identity";
import { isTwilio2FAEnabled } from "@/lib/auth/twilio-verify";
import { verifyTwoFactorToken } from "@/lib/auth/two-factor-token";
import { agentLog } from "@/lib/debug/agent-log";
import { prisma } from "@/lib/prisma";

ensureNextAuthEnv();

export const authOptions = {
  secret: resolveNextAuthSecret(),
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    updateAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
  },
  providers: [
    ...buildOAuthProviders(),
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { type: "email" },
        passkeyToken: { type: "text" },
        password: { type: "password" },
        twoFactorToken: { type: "text" },
      },
      async authorize(credentials) {
        // #region agent log
        agentLog("A", "authOptions.ts:authorize:entry", "authorize called", {
          hasEmail: Boolean(credentials?.email),
          hasPassword: Boolean(credentials?.password),
        });
        // #endregion

        if (credentials?.passkeyToken) {
          const token = verifyTwoFactorToken(
            credentials.passkeyToken,
            "credentials-passkey",
          );
          if (!token) return null;

          const user = await prisma.user.findUnique({
            where: { id: token.userId },
          });
          if (!user) return null;

          return {
            id: user.id,
            email: user.email ?? null,
            name: user.name ?? null,
            role: user.primaryRole,
            mfaVerified: true,
          };
        }

        if (credentials?.twoFactorToken) {
          const token = verifyTwoFactorToken(
            credentials.twoFactorToken,
            "credentials-2fa",
          );
          if (!token) return null;

          const user = await prisma.user.findUnique({
            where: { id: token.userId },
          });
          if (!user) return null;

          return {
            id: user.id,
            email: user.email ?? null,
            name: user.name ?? null,
            role: user.primaryRole,
            mfaVerified: true,
          };
        }

        if (isTwilio2FAEnabled()) {
          agentLog(
            "A",
            "authOptions.ts:authorize:2faRequired",
            "password-only credentials blocked by Twilio 2FA",
            {
              hasEmail: Boolean(credentials?.email),
            },
          );
          return null;
        }

        if (!credentials?.email || !credentials?.password) return null;

        const email = normalizeAuthEmail(credentials.email);
        const password = credentials.password.trim();

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            // #region agent log
            agentLog("A", "authOptions.ts:authorize:noUser", "user not found", {
              emailDomain: email.split("@")[1] ?? null,
            });
            // #endregion
            return null;
          }

          if (!user.passwordHash?.trim()) {
            agentLog(
              "A",
              "authOptions.ts:authorize:noPasswordHash",
              "user has no password hash",
              { userId: user.id },
            );
            return null;
          }

          const valid = await compare(password, user.passwordHash);
          if (!valid) {
            // #region agent log
            agentLog(
              "A",
              "authOptions.ts:authorize:badPassword",
              "password mismatch",
              { userId: user.id },
            );
            // #endregion
            return null;
          }

          // #region agent log
          agentLog(
            "A",
            "authOptions.ts:authorize:success",
            "authorize success",
            { userId: user.id, primaryRole: user.primaryRole },
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
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") {
        return true;
      }

      const email = user.email?.trim();
      if (!email) {
        return false;
      }

      try {
        let dbUser: Awaited<ReturnType<typeof ensureOAuthUser>>;
        if (account.provider === WORKOS_AUTHKIT_PROVIDER_ID) {
          const workOSProfile = (
            account as typeof account & { workos_profile?: unknown }
          ).workos_profile as WorkOSAuthKitProfile | undefined;
          if (
            !workOSProfile?.email_verified ||
            workOSProfile.id !== account.providerAccountId
          ) {
            console.error(
              "[auth] WorkOS AuthKit rejected an unverified or mismatched identity",
            );
            return false;
          }
          dbUser = await resolveAndLinkWorkOSIdentity({
            externalSubjectId: workOSProfile.id,
            verifiedEmail: workOSProfile.email,
            name: user.name,
          });
        } else {
          dbUser = await ensureOAuthUser({
            email,
            name: user.name,
          });
        }
        user.id = dbUser.id;
        (user as { role?: string }).role = dbUser.primaryRole;
        return true;
      } catch (error) {
        console.error("[auth] OAuth sign-in provisioning failed", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user?.id) {
        mergeUserIntoJwtToken(token as Record<string, unknown>, {
          id: user.id,
          email: user.email,
          name: user.name,
          role: (user as { role?: string }).role ?? null,
          mfaVerified: Boolean((user as { mfaVerified?: boolean }).mfaVerified),
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

      if (account?.provider === WORKOS_AUTHKIT_PROVIDER_ID) {
        token.workosAccessToken = account.access_token;
        token.workosRefreshToken = account.refresh_token;
        token.workosAccessTokenExpiresAt = account.expires_at
          ? account.expires_at * 1_000
          : Date.now() + 5 * 60 * 1_000;
        delete token.workosTokenError;
      }

      if (
        token.workosAccessToken &&
        token.workosRefreshToken &&
        typeof token.workosAccessTokenExpiresAt === "number" &&
        token.workosAccessTokenExpiresAt <= Date.now() + 60_000
      ) {
        try {
          const refreshed = await refreshWorkOSAuthKitToken(
            token.workosRefreshToken,
          );
          token.workosAccessToken = refreshed.accessToken;
          token.workosRefreshToken = refreshed.refreshToken;
          token.workosAccessTokenExpiresAt =
            refreshed.accessTokenExpiresAt ?? Date.now() + 5 * 60 * 1_000;
          delete token.workosTokenError;
        } catch (error) {
          console.error("[auth] WorkOS AuthKit token refresh failed", error);
          delete token.workosAccessToken;
          token.workosTokenError = "refresh_failed";
        }
      }
      return token as JWT;
    },
    session({ session, token }) {
      return mergeJwtTokenIntoSession(
        session as { user?: Record<string, unknown> },
        token as Record<string, unknown>,
      ) as typeof session;
    },
  },
} as AuthOptions;
