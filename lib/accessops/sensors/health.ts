import type { AccessSensorHealthStatus } from "@prisma/client";

export function projectSensorHealth(input: {
  lastHeartbeatAt?: Date | null;
  heartbeatWindowSeconds: number;
  compromised?: boolean;
  now?: Date;
}): AccessSensorHealthStatus {
  if (input.compromised) return "compromised";
  if (!input.lastHeartbeatAt) return "unknown";
  const now = input.now ?? new Date();
  return input.lastHeartbeatAt.getTime() +
    input.heartbeatWindowSeconds * 1000 >=
    now.getTime()
    ? "healthy"
    : "unknown";
}
