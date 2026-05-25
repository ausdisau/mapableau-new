import { Auth0Client } from "@auth0/nextjs-auth0/server";

import { getAuth0Env } from "@/lib/auth0/env";
import { mapableOnCallback } from "@/lib/auth0/on-callback";

const env = getAuth0Env();

export const auth0 = new Auth0Client({
  domain: env.AUTH0_DOMAIN!,
  clientId: env.AUTH0_CLIENT_ID!,
  clientSecret: env.AUTH0_CLIENT_SECRET!,
  secret: env.AUTH0_SECRET!,
  appBaseUrl: env.APP_BASE_URL,
  authorizationParameters: {
    scope: env.AUTH0_SCOPE,
    ...(env.AUTH0_AUDIENCE ? { audience: env.AUTH0_AUDIENCE } : {}),
  },
  routes: {
    login: "/auth/login",
    callback: "/auth/callback",
    logout: "/auth/logout",
  },
  session: {
    rolling: true,
    inactivityDuration: 24 * 60 * 60,
    absoluteDuration: 7 * 24 * 60 * 60,
  },
  onCallback: mapableOnCallback,
});
