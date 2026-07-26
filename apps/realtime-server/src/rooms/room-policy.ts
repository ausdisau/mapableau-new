import {
  lookupRoomMembership,
  type RoomMembershipResult,
} from "./room-membership.js";

/**
 * Non-sensitive room prefixes that only require a authenticated socket +
 * prefix allowlist (still scoped to the caller's own ids by convention).
 */
const ALLOWED_PREFIXES = [
  "user:",
  "thread:",
  "provider:",
  "booking:",
  "support-ticket:",
  "quality:",
] as const;

/** Sensitive live-ops channels — require verified ownership before join. */
const SENSITIVE_ROOM_RE = /^(trip_|care_|trip:|care:)(.+)$/;

const ADMIN_ROLES = new Set([
  "mapable_admin",
  "admin",
  "platform_admin",
]);

export function isAllowedRoom(room: string): boolean {
  return ALLOWED_PREFIXES.some((p) => room.startsWith(p));
}

export function parseSensitiveRoom(
  roomId: string,
): { resourceType: "trip" | "care"; resourceId: string } | null {
  const match = roomId.match(SENSITIVE_ROOM_RE);
  if (!match) return null;
  const prefix = match[1];
  const resourceId = match[2]?.trim();
  if (!resourceId || resourceId.length > 128) return null;
  const resourceType = prefix.startsWith("trip") ? "trip" : "care";
  return { resourceType, resourceId };
}

/**
 * Authorize a socket join.
 *
 * SECURITY:
 * - `trip_*` / `care_*` (and `trip:` / `care:`) ALWAYS require a DB/cache
 *   membership lookup proving participant, driver/worker, or admin ownership.
 * - Clients must never subscribe to sensitive channels by guessing resource IDs.
 * - Non-sensitive allowlisted prefixes still require a non-empty authenticated userId.
 */
export async function canJoinRoom(
  userId: string,
  userRole: string,
  roomId: string,
): Promise<RoomMembershipResult> {
  if (!userId || typeof userId !== "string" || userId.length < 3) {
    return { allowed: false, reason: "missing_user" };
  }
  if (!roomId || typeof roomId !== "string" || roomId.length > 200) {
    return { allowed: false, reason: "invalid_room" };
  }

  const sensitive = parseSensitiveRoom(roomId);
  if (sensitive) {
    // Admins still go through the membership API so access is audited centrally;
    // the API short-circuits admin roles after verifying the resource exists.
    return lookupRoomMembership({
      userId,
      userRole: userRole || "participant",
      roomId,
      resourceType: sensitive.resourceType,
      resourceId: sensitive.resourceId,
    });
  }

  if (!isAllowedRoom(roomId)) {
    return { allowed: false, reason: "prefix_not_allowed" };
  }

  // For user-scoped rooms, require the room suffix to match the caller.
  if (roomId.startsWith("user:")) {
    const ownerId = roomId.slice("user:".length);
    if (ownerId !== userId && !ADMIN_ROLES.has(userRole)) {
      return { allowed: false, reason: "user_room_mismatch" };
    }
  }

  return { allowed: true, reason: "allowlisted_prefix" };
}
