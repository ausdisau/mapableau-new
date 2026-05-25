import { peerConfig } from "@/lib/config/peer";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError } from "@/lib/api/response";

import {
  assertPeerCommunityAccess,
  requireActivePeerProfile,
} from "./access-control";

export async function requirePeerApiUser() {
  if (!peerConfig.peerModuleEnabled) {
    return jsonError("Peer module is not available", 404);
  }
  const sessionUser = await requireApiSession();
  if (sessionUser instanceof Response) return sessionUser;

  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  try {
    assertPeerCommunityAccess(user);
  } catch {
    return jsonError("Peer access denied", 403);
  }

  return user;
}

export async function requirePeerProfileApi() {
  const user = await requirePeerApiUser();
  if (user instanceof Response) return user;

  try {
    const profile = await requireActivePeerProfile(user.id);
    return { user, profile };
  } catch {
    return jsonError("Peer profile required", 403);
  }
}

export async function requirePeerModeratorApi() {
  if (!peerConfig.peerModuleEnabled) {
    return jsonError("Peer module is not available", 404);
  }
  const sessionUser = await requireApiPermission("peer:moderate");
  if (sessionUser instanceof Response) return sessionUser;
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  return user;
}

export async function requirePeerAdminApi() {
  if (!peerConfig.peerModuleEnabled) {
    return jsonError("Peer module is not available", 404);
  }
  const sessionUser = await requireApiPermission("peer:admin");
  if (sessionUser instanceof Response) return sessionUser;
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  return user;
}
