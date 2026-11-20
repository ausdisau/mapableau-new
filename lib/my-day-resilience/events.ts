import type { ScenarioEvent } from "@/lib/my-day-resilience/types";

/**
 * Append-only immutable scenario event log.
 * Events are never mutated or deleted; consumers copy the array.
 */
export class ImmutableEventLog {
  private readonly events: ScenarioEvent[] = [];

  constructor(private readonly tenantId: string) {}

  append(type: string, payload: Record<string, unknown>, at?: string): ScenarioEvent {
    const event: ScenarioEvent = {
      seq: this.events.length,
      id: `evt_${this.events.length}_${type}`,
      type,
      at: at ?? fixedClock(this.events.length),
      tenantId: this.tenantId,
      payload: Object.freeze({ ...payload }),
      immutable: true,
    };
    this.events.push(Object.freeze(event));
    return event;
  }

  list(): readonly ScenarioEvent[] {
    return this.events.slice();
  }

  snapshot(): ScenarioEvent[] {
    return this.events.map((e) => ({ ...e, payload: { ...e.payload } }));
  }

  assertTenant(tenantId: string): void {
    if (tenantId !== this.tenantId) {
      throw new CrossTenantAccessError(tenantId, this.tenantId);
    }
  }
}

export class CrossTenantAccessError extends Error {
  readonly code = "CROSS_TENANT_ACCESS" as const;
  constructor(
    readonly requestedTenantId: string,
    readonly owningTenantId: string,
  ) {
    super(
      `Cross-tenant access denied: requested ${requestedTenantId}, owner ${owningTenantId}`,
    );
    this.name = "CrossTenantAccessError";
  }
}

/** Deterministic clock for fixtures/replay (not wall-clock). */
export function fixedClock(seq: number): string {
  const base = Date.UTC(2026, 10, 9, 8, 0, 0);
  return new Date(base + seq * 60_000).toISOString();
}
