export function nextWebhookRetryAt(
  attemptCount: number,
  now: Date = new Date(),
): Date {
  const seconds = Math.min(3600, 2 ** Math.max(0, attemptCount) * 30);
  return new Date(now.getTime() + seconds * 1000);
}
