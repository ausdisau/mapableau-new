import type { AccessSensorHealthStatus } from "@prisma/client";

export function isActuationAllowed(): false {
  return false;
}

export function shouldSuspendSensorForSecurity(input: {
  compromised: boolean;
  integrityOk: boolean;
}): boolean {
  return input.compromised || !input.integrityOk;
}

export function secureSensorHealthStatus(input: {
  compromised: boolean;
  current: AccessSensorHealthStatus;
}): AccessSensorHealthStatus {
  return input.compromised ? "compromised" : input.current;
}
