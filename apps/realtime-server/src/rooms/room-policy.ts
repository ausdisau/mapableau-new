const ALLOWED_PREFIXES = [
  "user:",
  "thread:",
  "provider:",
  "booking:",
  "support-ticket:",
  "quality:",
] as const;

export function isAllowedRoom(room: string): boolean {
  if (!room || typeof room !== "string") return false;
  return ALLOWED_PREFIXES.some((p) => room.startsWith(p));
}

export function canJoinRoom(userId: string, room: string): boolean {
  if (!isAllowedRoom(room)) return false;

  if (room.startsWith("user:")) {
    return room === `user:${userId}`;
  }

  if (room.startsWith("thread:")) {
    return room.length > "thread:".length;
  }

  if (room.startsWith("provider:")) {
    return room.length > "provider:".length;
  }

  if (room.startsWith("booking:")) {
    return room.length > "booking:".length;
  }

  if (room.startsWith("support-ticket:")) {
    return room.length > "support-ticket:".length;
  }

  if (room.startsWith("quality:")) {
    return room.length > "quality:".length;
  }

  return false;
}

export function canPublishToRoom(userId: string, room: string): boolean {
  return canJoinRoom(userId, room);
}

export function authorizeRoom(
  userId: string,
  room: string,
  action: "join" | "publish",
): boolean {
  return action === "join"
    ? canJoinRoom(userId, room)
    : canPublishToRoom(userId, room);
}
