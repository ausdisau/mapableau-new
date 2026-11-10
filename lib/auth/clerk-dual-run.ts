/**
 * Dual-run gates for Clerk beside NextAuth.
 *
 * While Twilio Verify remains the app MFA source of truth, a Clerk password
 * session must not authorize MapAble users — imported bcrypt digests would
 * skip SMS. Disable TWILIO_2FA_ENABLED and enforce Clerk MFA at cutover.
 */

export function isClerkPublishableConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
}

export function shouldTrustClerkSessionAsAuth(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()) return false;
  if (env.TWILIO_2FA_ENABLED === "true") return false;
  return true;
}
