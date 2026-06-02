import { NextResponse } from "next/server";

import {
  buildOAuthProviders,
  getConfiguredOAuthProviders,
} from "@/lib/auth/oauth-providers";

export const dynamic = "force-dynamic";

const DEBUG_TOKEN = "7-Nwtla0HgYbTWPt8in9ZjSLm8KjGuOmYlaQImCuiKk";

const ENV_KEYS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_ID",
  "GOOGLE_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "FACEBOOK_CLIENT_ID",
  "FACEBOOK_CLIENT_SECRET",
  "FACEBOOK_APP_ID",
  "FACEBOOK_APP_SECRET",
] as const;

export function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  if (token !== DEBUG_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const env = Object.fromEntries(
    ENV_KEYS.map((key) => {
      const value = process.env[key]?.trim() ?? "";
      return [
        key,
        {
          present: value.length > 0,
          length: value.length,
        },
      ];
    }),
  );

  return NextResponse.json({
    ok: true,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
    providers: getConfiguredOAuthProviders(),
    providerIds: buildOAuthProviders().map((provider) => provider.id),
    env,
  });
}
