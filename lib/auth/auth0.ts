import { Auth0Client } from "@auth0/nextjs-auth0/server";
import type { SessionData } from "@auth0/nextjs-auth0/types";
import { NextResponse } from "next/server";

import { logAuthBridgeEvent } from "@/lib/auth/auth-audit-service";
import {
  type AuthBridgeSessionMeta,
  processAuthBridgeSession,
  resolveAuthBridgeRedirect,
} from "@/lib/auth/auth-bridge-service";
import { rejectUnsafeReturnTo } from "@/lib/auth/return-to";
import { getAuthEnv, isAuth0Configured } from "@/lib/config/auth-env";

function auth0Domain(): string | undefined {
  const domain = getAuthEnv().AUTH0_DOMAIN;
  if (!domain) return undefined;
  return domain.replace(/^https?:\/\//, "");
}

let auth0Client: Auth0Client | null = null;

function createAuth0Client(): Auth0Client {
  const env = getAuthEnv();

  return new Auth0Client({
    appBaseUrl: env.APP_BASE_URL,
    domain: auth0Domain(),
    authorizationParameters: {
      scope: env.AUTH0_SCOPE,
      ...(env.AUTH0_AUDIENCE ? { audience: env.AUTH0_AUDIENCE } : {}),
    },
    signInReturnToPath: "/dashboard",
    routes: {
      login: "/auth/login",
      logout: "/auth/logout",
      callback: "/auth/callback",
    },
    beforeSessionSaved: async (session) => {
      const sessionMeta = await processAuthBridgeSession(session);
      return {
        ...session,
        ...sessionMeta,
      } satisfies SessionData & AuthBridgeSessionMeta;
    },
    onCallback: async (error, ctx, session) => {
      const base = ctx.appBaseUrl ?? getAuthEnv().APP_BASE_URL ?? "http://localhost:3000";

      if (error || !session) {
        await logAuthBridgeEvent({
          eventType: "login_failed",
          source: "auth0_on_callback",
          metadata: { message: error?.message ?? "missing_session" },
        });
        return NextResponse.redirect(new URL("/login?error=auth", base));
      }

      await logAuthBridgeEvent({
        eventType: "auth0_callback_received",
        source: "auth0_on_callback",
        provider: session.user.sub?.split("|")[0] ?? null,
        metadata: { sub: session.user.sub },
      });

      const { safe, rejected } = rejectUnsafeReturnTo(ctx.returnTo);
      if (rejected) {
        await logAuthBridgeEvent({
          eventType: "unsafe_return_to_rejected",
          source: "auth0_on_callback",
          metadata: { returnTo: ctx.returnTo },
        });
      }

      const sessionMeta = session as SessionData & AuthBridgeSessionMeta;
      const redirectPath = await resolveAuthBridgeRedirect(sessionMeta, safe);

      return NextResponse.redirect(new URL(redirectPath, base));
    },
  });
}

export function getAuth0Client(): Auth0Client {
  if (!isAuth0Configured()) {
    throw new Error("Auth0 is not configured");
  }

  if (!auth0Client) {
    auth0Client = createAuth0Client();
  }

  return auth0Client;
}

export async function getAuth0Session(
  req?: Parameters<Auth0Client["getSession"]>[0],
) {
  if (!isAuth0Configured()) return null;

  try {
    const client = getAuth0Client();
    if (req) {
      return client.getSession(req);
    }
    return client.getSession();
  } catch {
    return null;
  }
}

export const auth0 = {
  getSession: getAuth0Session,
  middleware: (...args: Parameters<Auth0Client["middleware"]>) =>
    getAuth0Client().middleware(...args),
};
