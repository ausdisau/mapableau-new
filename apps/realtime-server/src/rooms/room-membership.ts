/**
 * Cached room-membership lookup for realtime socket authorization.
 *
 * SECURITY: trip_* / care_* (and trip:/care:) rooms require a verified
 * participant, driver/worker, or admin relationship. Lookups are cached briefly
 * to reduce DB load without granting long-lived unauthorized access.
 */

export type RoomMembershipQuery = {
  userId: string;
  userRole: string;
  roomId: string;
  resourceType: "trip" | "care" | "other";
  resourceId: string;
};

export type RoomMembershipResult = {
  allowed: boolean;
  reason: string;
};

type CacheEntry = {
  allowed: boolean;
  reason: string;
  expiresAt: number;
};

const CACHE_TTL_MS = 15_000;
const membershipCache = new Map<string, CacheEntry>();

function cacheKey(q: RoomMembershipQuery): string {
  return `${q.userId}|${q.userRole}|${q.roomId}`;
}

/**
 * Pluggable verifier — wired to the MapAble internal room-access API by default.
 * Tests may inject a stub via `setRoomMembershipVerifier`.
 */
export type RoomMembershipVerifier = (
  query: RoomMembershipQuery,
) => Promise<RoomMembershipResult>;

let verifier: RoomMembershipVerifier | null = null;

export function setRoomMembershipVerifier(
  next: RoomMembershipVerifier | null,
): void {
  verifier = next;
  membershipCache.clear();
}

async function defaultVerifier(
  query: RoomMembershipQuery,
): Promise<RoomMembershipResult> {
  const baseUrl = process.env.MAPABLE_INTERNAL_API_URL?.replace(/\/$/, "");
  const serviceToken = process.env.REALTIME_ROOM_ACCESS_TOKEN;

  // Fail closed when the membership store is not configured.
  if (!baseUrl || !serviceToken) {
    return {
      allowed: false,
      reason: "room_membership_store_unconfigured",
    };
  }

  const res = await fetch(`${baseUrl}/api/internal/realtime/room-access`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceToken}`,
    },
    body: JSON.stringify({
      userId: query.userId,
      userRole: query.userRole,
      roomId: query.roomId,
      resourceType: query.resourceType,
      resourceId: query.resourceId,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    return { allowed: false, reason: `membership_lookup_http_${res.status}` };
  }

  const data = (await res.json()) as { allowed?: boolean; reason?: string };
  return {
    allowed: Boolean(data.allowed),
    reason: data.reason ?? (data.allowed ? "ok" : "denied"),
  };
}

/** Database/cache lookup used by `canJoinRoom` before `socket.join`. */
export async function lookupRoomMembership(
  query: RoomMembershipQuery,
): Promise<RoomMembershipResult> {
  const key = cacheKey(query);
  const cached = membershipCache.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return { allowed: cached.allowed, reason: cached.reason };
  }

  const activeVerifier = verifier ?? defaultVerifier;
  const result = await activeVerifier(query);

  membershipCache.set(key, {
    allowed: result.allowed,
    reason: result.reason,
    expiresAt: now + CACHE_TTL_MS,
  });

  return result;
}
