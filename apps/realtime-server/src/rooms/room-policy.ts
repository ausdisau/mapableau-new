const ALLOWED_PREFIXES = [
  "user:",
  "thread:",
  "provider:",
  "booking:",
  "support-ticket:",
  "quality:",
];

export function isAllowedRoom(room: string): boolean {
  return ALLOWED_PREFIXES.some((p) => room.startsWith(p));
}
