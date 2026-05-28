/** Normalize Auth0 issuer URL (tenant domain with https). */
export function resolveAuth0Issuer(): string | undefined {
  const raw =
    process.env.AUTH0_ISSUER?.trim() || process.env.AUTH0_DOMAIN?.trim();
  if (!raw) return undefined;
  const withoutTrailingSlash = raw.replace(/\/+$/, "");
  if (withoutTrailingSlash.startsWith("https://")) {
    return withoutTrailingSlash;
  }
  return `https://${withoutTrailingSlash}`;
}

/** True when Auth0 is enabled and required OAuth env vars are set. */
export function isAuth0ProviderConfigured(): boolean {
  if (process.env.AUTH0_ENABLED !== "true") return false;
  return Boolean(
    process.env.AUTH0_CLIENT_ID?.trim() &&
      process.env.AUTH0_CLIENT_SECRET?.trim() &&
      resolveAuth0Issuer()
  );
}
