import { ensureNextAuthEnv } from "@/lib/auth/nextauth-env";

/** Canonical app origin for auth links (password reset, callbacks). */
export function getAppBaseUrl(): string {
  ensureNextAuthEnv();
  const fromNextAuth = process.env.NEXTAUTH_URL?.trim();
  if (fromNextAuth) return fromNextAuth.replace(/\/$/, "");

  const fromPublic = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromPublic) return fromPublic.replace(/\/$/, "");

  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }

  return "http://localhost:3000";
}
