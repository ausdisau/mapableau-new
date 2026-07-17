import { randomUUID } from "node:crypto";

/** Generate a correlation ID for claim and external-call tracing. */
export function createCorrelationId(): string {
  return randomUUID();
}
