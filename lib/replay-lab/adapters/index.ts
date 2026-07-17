import type { ReplayRunContext } from "../run-context";
import type { ReplayEventEnvelope } from "../types";

import { communicationsAdapterHandle } from "./communications";
import { transportAdapterHandle } from "./transport";
import { workforceAdapterHandle } from "./workforce";

export * from "./write-guard";
export * from "./communications";
export * from "./workforce";
export * from "./transport";

/**
 * Dispatch synthetic domain adapters. Never writes production domain tables.
 * Deduplicates adapter emissions when the scenario timeline already recorded the same effect.
 */
export function runDomainAdapters(
  event: ReplayEventEnvelope,
  ctx: ReplayRunContext,
): ReplayEventEnvelope[] {
  const emitted: ReplayEventEnvelope[] = [];
  const existingTypes = new Set(
    ctx.ledger.list().map((e) => `${e.eventType}:${JSON.stringify(e.payload.proposalId ?? "")}`),
  );

  const candidates = [
    ...communicationsAdapterHandle(event, ctx),
    ...workforceAdapterHandle(event, ctx),
    ...transportAdapterHandle(event, ctx),
  ];

  for (const c of candidates) {
    const key = `${c.eventType}:${JSON.stringify(c.payload.proposalId ?? "")}`;
    // Avoid duplicating timeline-authored rejection/block events.
    if (existingTypes.has(key)) continue;
    if (
      c.eventType === event.eventType &&
      JSON.stringify(c.payload) === JSON.stringify(event.payload)
    ) {
      continue;
    }
    const appended = ctx.ledger.append(c);
    existingTypes.add(key);
    emitted.push(appended);
  }

  return emitted;
}
