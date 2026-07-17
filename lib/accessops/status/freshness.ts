import type { AccessOperationalState, AccessStatusEvent } from "@prisma/client";

import { AVAILABLE_STATES, BLOCKING_STATES } from "../types";

export type StatusFreshnessEvent = Pick<
  AccessStatusEvent,
  "effectiveFrom" | "freshnessWindowSeconds" | "state"
>;

export function freshnessDeadline(event: StatusFreshnessEvent): Date {
  return new Date(
    event.effectiveFrom.getTime() + event.freshnessWindowSeconds * 1000,
  );
}

export function isStatusFresh(
  event: StatusFreshnessEvent,
  now: Date = new Date(),
): boolean {
  return freshnessDeadline(event).getTime() >= now.getTime();
}

export function isOperationallyAvailable(
  state: AccessOperationalState,
): boolean {
  return AVAILABLE_STATES.includes(state);
}

export function isOperationallyBlocking(
  state: AccessOperationalState,
): boolean {
  return BLOCKING_STATES.includes(state);
}
