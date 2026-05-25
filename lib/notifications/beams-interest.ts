/** Device interest for per-user web push (Pusher Beams). */
export function beamsUserInterest(userId: string): string {
  return `mapable-user-${userId}`;
}
