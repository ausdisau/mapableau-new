import type {
  AckMessageInput,
  PresenceInput,
  PublishMessageInput,
  TypingInput,
} from "../core/types.js";
import { StreamError } from "../core/types.js";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function parseRoom(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new StreamError("INVALID_PAYLOAD", "room must be a non-empty string");
  }
  return value.trim();
}

export function parsePublishPayload(value: unknown): Omit<PublishMessageInput, "senderId"> {
  const record = asRecord(value);
  if (!record) {
    throw new StreamError("INVALID_PAYLOAD", "publish payload must be an object");
  }
  const room = parseRoom(record.room);
  const body = typeof record.body === "string" ? record.body : "";
  const metadata =
    record.metadata && typeof record.metadata === "object"
      ? (record.metadata as Record<string, unknown>)
      : undefined;
  return { room, body, metadata };
}

export function parseAckPayload(value: unknown): Omit<AckMessageInput, "userId"> {
  const record = asRecord(value);
  if (!record) {
    throw new StreamError("INVALID_PAYLOAD", "ack payload must be an object");
  }
  const messageId =
    typeof record.messageId === "string" ? record.messageId.trim() : "";
  if (!messageId) {
    throw new StreamError("INVALID_PAYLOAD", "messageId is required");
  }
  const room =
    typeof record.room === "string" && record.room.trim()
      ? record.room.trim()
      : undefined;
  return { messageId, room: room ?? "" };
}

export function parseTypingPayload(value: unknown): Omit<TypingInput, "userId"> {
  const record = asRecord(value);
  if (!record) {
    throw new StreamError("INVALID_PAYLOAD", "typing payload must be an object");
  }
  return {
    room: parseRoom(record.room),
    isTyping: record.isTyping !== false,
  };
}

export function parsePresencePayload(
  value: unknown,
): Omit<PresenceInput, "userId"> {
  const record = asRecord(value);
  if (!record) {
    throw new StreamError("INVALID_PAYLOAD", "presence payload must be an object");
  }
  const status = record.status;
  if (status !== "online" && status !== "offline" && status !== "away") {
    throw new StreamError("INVALID_PAYLOAD", "presence status is invalid");
  }
  return {
    room: parseRoom(record.room),
    status,
  };
}
