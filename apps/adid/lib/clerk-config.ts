/** Render the service directory even when this deployment has no identity tenant. */
export function hasClerkTenant(env: Readonly<Record<string, string | undefined>> = process.env): boolean {
  const publicKey = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const secret = env.CLERK_SECRET_KEY?.trim();
  return Boolean(publicKey && secret);
}
