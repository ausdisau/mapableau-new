export function isRateLimited(
  requestsInWindow: number,
  rateLimitRpm: number,
): boolean {
  return requestsInWindow >= rateLimitRpm;
}
