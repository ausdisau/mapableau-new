/** Shared HMAC secret for short-lived bridge tokens and legacy signing. */
export function getAppSecret(): string {
  const secret =
    process.env.APP_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "APP_SECRET (or legacy NEXTAUTH_SECRET) is required for auth bridge tokens"
    );
  }

  return secret;
}

export function getAppSecretBytes(): Uint8Array {
  return new TextEncoder().encode(getAppSecret());
}
