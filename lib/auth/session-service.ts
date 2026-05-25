import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import type { CurrentUser } from "@/lib/auth/current-user";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function getSessionUser(): Promise<CurrentUser | null> {
  return getCurrentUser();
}

export async function requireSessionUser(): Promise<CurrentUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("UNAUTHENTICATED");
  }
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export function isSafeReturnTo(url: string | null | undefined): boolean {
  if (!url) return false;
  if (!url.startsWith("/")) return false;
  if (url.startsWith("//")) return false;
  if (url.includes("://")) return false;
  if (url.includes("\\")) return false;
  const blocked = ["/api/", "/login", "/register"];
  return !blocked.some((prefix) => url.startsWith(prefix));
}

export function resolveReturnTo(
  returnTo: string | null | undefined,
  fallback = "/dashboard"
): string {
  return isSafeReturnTo(returnTo) ? (returnTo as string) : fallback;
}
