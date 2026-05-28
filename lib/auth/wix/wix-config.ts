export function isWixEnabled(): boolean {
  return process.env.WIX_ENABLED === "true";
}

export function isWixPublicEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WIX_ENABLED === "true";
}

export function getWixConfig() {
  return {
    clientId: process.env.WIX_CLIENT_ID ?? "",
    redirectUri: process.env.WIX_REDIRECT_URI ?? "",
    loginOriginUri: process.env.WIX_LOGIN_ORIGIN_URI ?? "",
  };
}

export function isWixConfigured(): boolean {
  const c = getWixConfig();
  return Boolean(c.clientId && c.redirectUri && c.loginOriginUri);
}
