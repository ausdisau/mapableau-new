import { cookies } from "next/headers";

import type { OauthData } from "@wix/sdk";

const WIX_OAUTH_COOKIE = "wix_oauth_data";

export type StoredWixOAuth = OauthData & {
  returnTo: string;
};

export async function setWixOAuthData(data: StoredWixOAuth) {
  const store = await cookies();
  store.set(WIX_OAUTH_COOKIE, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
}

export async function consumeWixOAuthData(): Promise<StoredWixOAuth | null> {
  const store = await cookies();
  const raw = store.get(WIX_OAUTH_COOKIE)?.value;
  store.delete(WIX_OAUTH_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredWixOAuth;
  } catch {
    return null;
  }
}

export { isSafeRedirect } from "@/lib/auth/safe-redirect";
