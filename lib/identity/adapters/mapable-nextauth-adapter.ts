import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { mapableIdConfig } from "@/lib/config/mapable-id";
import type {
  IdentityAdapterDescriptor,
  VerifiedAuthSubject,
} from "@/lib/identity/adapters/types";

export function describeMapAbleNextAuthAdapter(): IdentityAdapterDescriptor {
  return {
    id: "mapable-nextauth",
    label: "MapAble NextAuth session issuer",
    status: "active",
    reason: "Sole live session issuer for MapAbleID v0.3",
  };
}

/**
 * Resolve the authenticated NextAuth subject for MapAbleID.
 * Audience and issuer are server constants — never taken from the browser.
 */
export async function resolveNextAuthSubject(): Promise<VerifiedAuthSubject | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;

  // NextAuth JWT sessions do not expose a stable session id on getServerSession;
  // use a deterministic server-bound reference for policy shadowing only.
  const sessionId = `nextauth:${userId}`;
  const expiresAtMs = Date.now() + 60 * 60 * 1000;

  return {
    subjectId: userId,
    issuer: mapableIdConfig.trustedIssuers[0],
    audience: mapableIdConfig.audience,
    sessionId,
    expiresAtMs,
  };
}
