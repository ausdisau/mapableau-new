# MapAble Transport Sentinel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Transport Sentinel shadow-mode supervision for assignment readiness and service disruption without changing canonical Transport ownership or automatically assigning replacements.

**Architecture:** Transport Sentinel reuses `checkDriverEligibilityForTrip`, `checkVehicleEligibility`, Transport status transitions, the existing CloudEvent outbox, Sentinel Core policy/state contracts, and ContinuityOS recovery. The first slice is pure evaluation plus event emission; blocking remains feature-flagged off by default.

**Tech Stack:** TypeScript, Zod, Vitest, Prisma-backed existing Transport services, Sentinel Core contracts.

**Spec:** `docs/superpowers/specs/2026-09-14-mapable-sentinel-runtime-transport-employment-design.md`

## Global Constraints

- No automatic driver/vehicle assignment or substitution.
- Unknown vehicle/access evidence remains unknown and cannot be treated as compatible.
- Existing Transport service is system of record.
- Existing eligibility services remain authoritative for driver/vehicle readiness.
- `MAPABLE_SENTINEL_TRANSPORT_GATING_ENABLED=false` by default.
- First release operates in shadow mode unless explicitly enabled later.

---

### Task 1: Transport Sentinel preflight evaluator

**Files:**
- Create: `lib/ai/platform/sentinel/transport/preflight.ts`
- Test: `tests/ai-platform/sentinel/transport/preflight.test.ts`

**Interfaces:**

```ts
export type TransportPreflightInput = {
  tripId: string;
  driverId: string;
  vehicleId: string;
  mobilityRequirements: Record<string, unknown>;
};

export type TransportPreflightDecision = {
  outcome: "READY" | "PAUSE";
  reasonCodes: string[];
  unknownEvidence: string[];
};

export async function evaluateTransportPreflight(
  input: TransportPreflightInput,
): Promise<TransportPreflightDecision>;
```

- [ ] **Step 1: Write failing tests**

Test with injected evaluator dependencies so unit tests do not require Prisma:

```ts
it("pauses when driver eligibility fails", async () => {
  const result = await evaluateTransportPreflightWith({
    driver: async () => ({ eligible: false, reasons: ["licence has expired"] }),
    vehicle: async () => ({ eligible: true, reasons: [] }),
  })({ tripId: "t1", driverId: "d1", vehicleId: "v1", mobilityRequirements: {} });
  expect(result.outcome).toBe("PAUSE");
  expect(result.reasonCodes).toContain("TRANSPORT_DRIVER_NOT_ELIGIBLE");
});

it("pauses when vehicle compatibility is unknown", async () => {
  const result = await evaluateTransportPreflightWith({
    driver: async () => ({ eligible: true, reasons: [] }),
    vehicle: async () => ({ eligible: false, reasons: ["Access equipment verification missing"] }),
  })({ tripId: "t1", driverId: "d1", vehicleId: "v1", mobilityRequirements: { requiresHoist: true } });
  expect(result.outcome).toBe("PAUSE");
  expect(result.unknownEvidence).toContain("vehicle_access_equipment");
});
```

- [ ] **Step 2: Run RED**

```bash
pnpm vitest run tests/ai-platform/sentinel/transport/preflight.test.ts
```

- [ ] **Step 3: Implement dependency-injected evaluator and production wrapper**

Use existing `checkDriverEligibilityForTrip` and `checkVehicleEligibility` in the production wrapper. Map eligibility failure reasons to stable Sentinel reason codes without copying credential logic.

- [ ] **Step 4: Run GREEN**

```bash
pnpm vitest run tests/ai-platform/sentinel/transport/preflight.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/ai/platform/sentinel/transport/preflight.ts tests/ai-platform/sentinel/transport/preflight.test.ts
git commit -m "feat(sentinel): add transport preflight supervision"
```

### Task 2: Transport disruption evaluator

**Files:**
- Create: `lib/ai/platform/sentinel/transport/disruption.ts`
- Test: `tests/ai-platform/sentinel/transport/disruption.test.ts`

**Interfaces:**

```ts
export type TransportDisruptionKind = "driver_no_show" | "vehicle_unavailable";

export function evaluateTransportDisruption(input: {
  kind: TransportDisruptionKind;
  tripStatus: TransportTripStatus;
}): {
  state: "RECOVERY_PROPOSED" | "PAUSED";
  reasonCodes: string[];
  recoveryRequired: true;
};
```

- [ ] **Step 1: Write tests proving both no-show and vehicle-unavailable require recovery and never auto-select a replacement.**
- [ ] **Step 2: Run RED.**
- [ ] **Step 3: Implement a pure deterministic mapper using existing `TransportTripStatus` values.**
- [ ] **Step 4: Run GREEN.**
- [ ] **Step 5: Commit.**

### Task 3: Shadow event adapter to canonical CloudEvent outbox

**Files:**
- Create: `lib/ai/platform/sentinel/transport/events.ts`
- Test: `tests/ai-platform/sentinel/transport/events.test.ts`

**Interfaces:**

```ts
export function buildTransportSentinelEvent(input: {
  id: string;
  tenantId: string;
  participantId?: string;
  tripId: string;
  correlationId: string;
  traceId: string;
  eventType: "transport.assignment.proposed" | "transport.driver.no_show" | "transport.vehicle.unavailable";
  evidenceRefs?: string[];
}): SentinelEventEnvelope;
```

- [ ] **Step 1: Write a failing test proving generated events contain references only and never exact address or mobility payload copies.**
- [ ] **Step 2: Run RED.**
- [ ] **Step 3: Implement the builder and a conversion helper to the existing `cloudEventEnvelopeSchema`; do not create another outbox table/service.**
- [ ] **Step 4: Run GREEN.**
- [ ] **Step 5: Commit.**

### Task 4: Shadow-mode integration at assignment boundary

**Files:**
- Modify: `lib/transport/transport-assignment-service.ts`
- Create: `lib/ai/platform/sentinel/transport/shadow.ts`
- Test: `tests/ai-platform/sentinel/transport/assignment-shadow.test.ts`

**Behaviour:**

- When Sentinel is disabled: existing assignment behavior is unchanged.
- When Sentinel is enabled but Transport gating is false: evaluate preflight, emit/audit the would-pause decision, then continue through the existing Transport eligibility gate.
- Do not duplicate or weaken `assertDriverEligible` / `assertVehicleEligible`.
- Do not block on Sentinel shadow outcome.

- [ ] **Step 1: Write failing dependency-injected shadow tests.**
- [ ] **Step 2: Run RED.**
- [ ] **Step 3: Implement `observeTransportAssignment()` and call it immediately before canonical eligibility assertions.**
- [ ] **Step 4: Run focused Transport/Sentinel tests plus existing Transport scheduling tests.**

```bash
pnpm vitest run tests/ai-platform/sentinel/transport
pnpm vitest run tests/transport-scheduling-routing.test.ts
```

- [ ] **Step 5: Commit.**

## Plan Self-Review

This plan implements only the approved first Transport vertical slice and shadow integration. Controlled blocking, participant recovery UI, Temporal transport workflow startup and production enablement are deferred until shadow evidence is reviewed.
