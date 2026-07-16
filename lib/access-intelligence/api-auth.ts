import {
  accessIntelligenceConfig,
  isDemoMode,
} from "@/lib/access-intelligence/configuration";
import { createServerAccessContext } from "@/lib/access-intelligence/server-context";
import { requireApiSession } from "@/lib/api/auth-handler";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";

export async function resolveAccessIntelligenceUserId(): Promise<
  string | Response
> {
  if (isDemoMode()) {
    const user = await getCurrentUser();
    return user?.id ?? createServerAccessContext({ userId: null }).userId;
  }
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  return session.id;
}

/**
 * Resolve a CurrentUser for venue Operate/Improve gates.
 * Demo mode may synthesize a participant demo user when unsigned-in.
 * Production always requires a real NextAuth session.
 */
export async function resolveAccessIntelligenceUser(): Promise<
  CurrentUser | Response
> {
  if (isDemoMode()) {
    const user = await getCurrentUser();
    if (user) return user;
    return {
      id: accessIntelligenceConfig.demoUserId,
      email: "demo@access-intelligence.local",
      name: "Access Intelligence Demo",
      phone: null,
      timezone: "Australia/Sydney",
      locale: "en-AU",
      primaryRole: "participant",
      roles: ["participant"],
    };
  }
  return requireApiSession();
}
