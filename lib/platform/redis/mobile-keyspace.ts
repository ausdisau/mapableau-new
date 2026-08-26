const REDIS_SEGMENT = /^[A-Za-z0-9_-]{1,128}$/;
const SHA256_HEX = /^[a-f0-9]{64}$/;

function safeSegment(value: string, label: string): string {
  const trimmed = value.trim();
  if (!REDIS_SEGMENT.test(trimmed)) {
    throw new Error(`${label} must contain only letters, numbers, underscore or hyphen`);
  }
  return trimmed;
}

function safeDigest(value: string): string {
  const digest = value.trim().toLowerCase();
  if (!SHA256_HEX.test(digest)) {
    throw new Error("cache digest must be a SHA-256 hex string");
  }
  return digest;
}

/**
 * Server-only Redis keyspace for MapAble mobile/realtime coordination.
 *
 * Redis is not a system of record. Participant, booking, trip, consent and
 * employment data stay in PostgreSQL. These keys contain ephemeral state,
 * identifiers and minimal event metadata only.
 *
 * We intentionally do not add Redis Cluster hash tags here. None of the
 * current operations require atomic multi-key commands, and tagging every
 * tenant key would create avoidable hot slots. Add hash tags only when a
 * concrete multi-key atomic operation requires them.
 */
export const mobileRedisKeys = {
  tenantEventStream(tenantId: string): string {
    return `tenant:${safeSegment(tenantId, "tenantId")}:mobile:events`;
  },

  userPresence(tenantId: string, userId: string): string {
    return `tenant:${safeSegment(tenantId, "tenantId")}:mobile:presence:${safeSegment(userId, "userId")}`;
  },

  actionIdempotency(tenantId: string, actionId: string): string {
    return `tenant:${safeSegment(tenantId, "tenantId")}:mobile:idempotency:${safeSegment(actionId, "actionId")}`;
  },

  roomMembership(tenantId: string, roomId: string): string {
    return `tenant:${safeSegment(tenantId, "tenantId")}:mobile:room:${safeSegment(roomId, "roomId")}:members`;
  },

  publicAccessSearchCache(queryDigest: string): string {
    return `public:access:search:${safeDigest(queryDigest)}`;
  },
};

export const MOBILE_REDIS_TTL_SECONDS = {
  presence: 90,
  idempotency: 10 * 60,
  publicAccessSearch: 5 * 60,
} as const;

export const MOBILE_REDIS_STRUCTURES = {
  tenantEventStream: "stream",
  userPresence: "hash",
  actionIdempotency: "string",
  roomMembership: "set",
  publicAccessSearchCache: "string",
} as const;

export const MOBILE_REDIS_EVENT_TYPES = [
  "care.booking.updated",
  "care.shift.updated",
  "transport.trip.updated",
  "transport.booking.updated",
  "jobs.application.updated",
  "notification.created",
] as const;

export type MobileRedisEventType = (typeof MOBILE_REDIS_EVENT_TYPES)[number];

export type MobileRedisEventEnvelope = {
  eventId: string;
  eventType: MobileRedisEventType;
  occurredAt: string;
  tenantId: string;
  actorUserId?: string;
  entityId: string;
  entityType: "careBooking" | "careShift" | "transportTrip" | "transportBooking" | "jobApplication" | "notification";
  /** Minimal structured metadata only. No participant narratives or clinical notes. */
  metadata?: Record<string, string | number | boolean | null>;
};
