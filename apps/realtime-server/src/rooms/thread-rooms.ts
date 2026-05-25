export function userRoom(profileId: string) {
  return `user:${profileId}`;
}

export function threadRoom(threadId: string) {
  return `thread:${threadId}`;
}

export function providerRoom(providerId: string) {
  return `provider:${providerId}`;
}

export function bookingRoom(bookingId: string) {
  return `booking:${bookingId}`;
}

export function supportTicketRoom(supportTicketId: string) {
  return `support-ticket:${supportTicketId}`;
}

export function canJoinThreadRoom(
  threadId: string,
  allowedThreadIds: Set<string> | undefined
): boolean {
  if (!allowedThreadIds) return false;
  return allowedThreadIds.has(threadId);
}
