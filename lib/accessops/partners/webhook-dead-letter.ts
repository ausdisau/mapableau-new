export function shouldDeadLetterWebhook(
  attemptCount: number,
  maxAttempts = 8,
): boolean {
  return attemptCount >= maxAttempts;
}
