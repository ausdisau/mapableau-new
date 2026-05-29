import { getWixLoginOriginUri, getWixRedirectUri } from "@/lib/app-url";

export function isWixEnabled(): boolean {
  return process.env.WIX_ENABLED === "true";
}

export function isWixPublicEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WIX_ENABLED === "true";
}

export function getWixConfig() {
  return {
    clientId: process.env.WIX_CLIENT_ID ?? "",
    redirectUri: getWixRedirectUri(),
    loginOriginUri: getWixLoginOriginUri(),
  };
}

export function isWixConfigured(): boolean {
  const c = getWixConfig();
  return Boolean(c.clientId && c.redirectUri && c.loginOriginUri);
}
