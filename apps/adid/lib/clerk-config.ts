import { parsePublishableKey } from "@clerk/shared/keys";

export function clerkFrontendOrigin(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Keep public navigation available while a deployment is missing its tenant. */
export function hasClerkTenant(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  const key = parsePublishableKey(
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim(),
  );
  const secret = env.CLERK_SECRET_KEY?.trim();
  if (!key || !secret) return false;
  const prefix = key.instanceType === "production" ? "sk_live_" : "sk_test_";
  if (!secret.startsWith(prefix) || secret.length === prefix.length)
    return false;
  const expected = env.CLERK_FRONTEND_API_URL;
  return (
    expected === undefined ||
    clerkFrontendOrigin(expected) === "https://" + key.frontendApi
  );
}
