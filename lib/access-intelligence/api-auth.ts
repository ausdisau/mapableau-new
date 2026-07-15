import { isDemoMode } from "@/lib/access-intelligence/configuration";
import { createServerAccessContext } from "@/lib/access-intelligence/server-context";
import { requireApiSession } from "@/lib/api/auth-handler";
import { getCurrentUser } from "@/lib/auth/current-user";

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
