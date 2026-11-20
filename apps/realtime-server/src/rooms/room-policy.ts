import type { SocketIdentity } from "../auth/socket-auth";

const DISPATCHER_ROLES = new Set([
  "mapable_admin",
  "provider_admin",
  "transport_operator",
]);

const WORKER_ROLES = new Set([
  "support_worker",
  "support_coordinator",
  "provider_admin",
  "mapable_admin",
]);

export type ParsedRoom =
  | { kind: "user"; resourceId: string; raw: string }
  | { kind: "thread"; resourceId: string; raw: string }
  | { kind: "provider"; resourceId: string; raw: string }
  | { kind: "booking"; resourceId: string; raw: string }
  | { kind: "support-ticket"; resourceId: string; raw: string }
  | { kind: "quality"; resourceId: string; raw: string }
  | { kind: "trip"; resourceId: string; raw: string }
  | { kind: "care"; resourceId: string; raw: string };

export class RoomAuthorizationError extends Error {
  readonly code = "ROOM_FORBIDDEN";

  constructor(message = "Not authorised to join this room") {
    super(message);
    this.name = "RoomAuthorizationError";
  }
}

/**
 * Parse a client-supplied room id into a typed resource reference.
 * Rejects opaque / unrecognised formats — never trust raw room strings.
 */
export function parseRoomId(room: string): ParsedRoom | null {
  if (typeof room !== "string") return null;
  const raw = room.trim();
  if (!raw || raw.length > 200) return null;

  const prefixed = raw.match(
    /^(user|thread|provider|booking|support-ticket|quality):([A-Za-z0-9_-]+)$/,
  );
  if (prefixed) {
    return {
      kind: prefixed[1] as ParsedRoom["kind"],
      resourceId: prefixed[2]!,
      raw,
    };
  }

  const underscored = raw.match(/^(trip|care)_([A-Za-z0-9_-]+)$/);
  if (underscored) {
    return {
      kind: underscored[1] as "trip" | "care",
      resourceId: underscored[2]!,
      raw,
    };
  }

  return null;
}

/** Legacy prefix allow-list (structural only — not an authorization decision). */
export function isAllowedRoom(room: string): boolean {
  return parseRoomId(room) !== null;
}

/**
 * Async authorization for realtime room joins (anti-IDOR).
 * Validates the authenticated socket identity against the requested room.
 * Throws RoomAuthorizationError when the client must be rejected/disconnected.
 */
export async function authorizeRoomJoin(
  identity: SocketIdentity,
  roomId: string,
): Promise<ParsedRoom> {
  if (!identity.userId || !identity.role) {
    throw new RoomAuthorizationError("Unauthenticated socket");
  }

  const parsed = parseRoomId(roomId);
  if (!parsed) {
    throw new RoomAuthorizationError("Invalid room id");
  }

  // Explicit grants issued inside the HMAC-signed auth token.
  if (identity.roomGrants?.includes(parsed.raw)) {
    return parsed;
  }

  const allowed = await resolveRoomMembership(identity, parsed);
  if (!allowed) {
    throw new RoomAuthorizationError(
      `Forbidden: ${identity.userId} cannot join ${parsed.raw}`,
    );
  }

  return parsed;
}

/**
 * Membership check for a specific session/resource.
 * Uses optional HTTP internal lookup (`SOCKETIO_MEMBERSHIP_URL`) when set;
 * otherwise self-id rooms only (booking/care/trip require signed grants).
 *
 * Provider rooms are tenant-bound: dispatcher roles alone are insufficient —
 * require grant, self-id match, or membership API allow.
 */
async function resolveRoomMembership(
  identity: SocketIdentity,
  room: ParsedRoom,
): Promise<boolean> {
  switch (room.kind) {
    case "user":
      return identity.userId === room.resourceId;

    case "provider": {
      if (identity.userId === room.resourceId) return true;
      // Role alone is not enough for cross-tenant provider rooms.
      if (!DISPATCHER_ROLES.has(identity.role)) return false;
      return lookupMembershipViaHttp(identity, room);
    }

    case "thread":
    case "support-ticket":
    case "quality":
      return false;

    case "booking":
    case "care":
    case "trip": {
      if (identity.userId === room.resourceId) return true;
      const membershipOk = await lookupMembershipViaHttp(identity, room);
      if (membershipOk) return true;
      if (
        WORKER_ROLES.has(identity.role) ||
        DISPATCHER_ROLES.has(identity.role)
      ) {
        return false;
      }
      return false;
    }

    default: {
      const _exhaustive: never = room;
      return _exhaustive;
    }
  }
}

/**
 * Internal membership lookup.
 * Fail closed when SOCKETIO_MEMBERSHIP_URL is set without a real SOCKETIO_INTERNAL_TOKEN.
 * Never defaults the internal token to a weak value like "1".
 */
async function lookupMembershipViaHttp(
  identity: SocketIdentity,
  room: ParsedRoom,
): Promise<boolean> {
  const base = process.env.SOCKETIO_MEMBERSHIP_URL?.trim();
  if (!base) return false;

  const internalToken = process.env.SOCKETIO_INTERNAL_TOKEN?.trim() || "";
  if (internalToken.length < 16) {
    // Fail closed — do not call membership with a weak/default secret.
    return false;
  }

  try {
    const url = new URL(base);
    url.searchParams.set("userId", identity.userId);
    url.searchParams.set("role", identity.role);
    url.searchParams.set("room", room.raw);
    url.searchParams.set("kind", room.kind);
    url.searchParams.set("resourceId", room.resourceId);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-socketio-internal": internalToken,
      },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { allowed?: unknown };
    return body.allowed === true;
  } catch {
    return false;
  }
}

/**
 * Authorize join or throw; caller should disconnect on failure.
 */
export async function assertCanJoinRoomOrThrow(
  identity: SocketIdentity | null | undefined,
  roomId: string,
): Promise<ParsedRoom> {
  if (!identity) {
    throw new RoomAuthorizationError("Unauthenticated socket");
  }
  return authorizeRoomJoin(identity, roomId);
}
