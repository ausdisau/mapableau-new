/**
 * Auth backend selection: Neon Auth (managed) vs NextAuth (legacy).
 * Neon is used when AUTH_PROVIDER=neon or when Neon Auth env is fully configured.
 */
export function isNeonAuthEnabled(): boolean {
  const provider = process.env.AUTH_PROVIDER?.trim().toLowerCase();
  if (provider === "nextauth") return false;
  if (provider === "neon") return true;

  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim();
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET?.trim();
  return Boolean(baseUrl && cookieSecret && cookieSecret.length >= 32);
}
