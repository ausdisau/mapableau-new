import { randomUUID } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  mapAlexaIntentToProposal,
  ALEXA_INTENT_FIXTURES,
} from "@/lib/home/adapters/alexa/alexa-mapper";
import { mapGoogleTraitToCapability } from "@/lib/home/adapters/google-home/google-home-mapper";
import { mapMatterClusterToCapability } from "@/lib/home/adapters/matter/matter-mapper";
import { HomeActionBroker } from "@/lib/home/core/action-broker";
import {
  CONFIRMATION_TTL_MS,
  evaluateHomeAuthority,
  refuseConfirmation,
  type AuthorityEvaluatorContext,
  type PendingConfirmation,
} from "@/lib/home/core/authority-evaluator";
import {
  isUsableKnownState,
  normalizeCapabilityState,
} from "@/lib/home/core/state-normalizer";
import type { HomeCapabilityAdapter } from "@/lib/home/contracts/adapter";
import type {
  AuthorizedHomeAction,
  HomeActionReceipt,
  HomeActionRequest,
} from "@/lib/home/contracts/action";
import type { DelegatedAuthority } from "@/lib/home/contracts/authority";
import {
  evaluateRoutineForSimulator,
  getHomeEnvironmentSnapshot,
  listSimulatorRoutines,
  proposeHomeAction,
  resetHomeSimulatorRuntime,
} from "@/lib/home/service";

const FLAG_KEYS = [
  "MAPABLE_HOME_ENV_ENABLED",
  "MAPABLE_HOME_ENV_SIMULATOR_ENABLED",
  "MAPABLE_HOME_ENV_REAL_DEVICE_ACTIONS_ENABLED",
] as const;

function baseRequest(
  overrides: Partial<HomeActionRequest> = {},
): HomeActionRequest {
  return {
    id: randomUUID(),
    correlationId: randomUUID(),
    participantId: "participant-1",
    actorId: "participant-1",
    endpointId: "sim-hall-light",
    capabilityKind: "TURN_ON",
    requestedAt: new Date().toISOString(),
    ...overrides,
  };
}

function baseCtx(
  overrides: Partial<AuthorityEvaluatorContext> = {},
): AuthorityEvaluatorContext {
  return {
    participantAutonomyCeiling: "H3_CONFIRM",
    pendingConfirmations: new Map(),
    ...overrides,
  };
}

beforeEach(() => {
  process.env.MAPABLE_HOME_ENV_ENABLED = "true";
  process.env.MAPABLE_HOME_ENV_SIMULATOR_ENABLED = "true";
  process.env.MAPABLE_HOME_ENV_REAL_DEVICE_ACTIONS_ENABLED = "false";
  resetHomeSimulatorRuntime();
});

afterEach(() => {
  for (const key of FLAG_KEYS) delete process.env[key];
  vi.useRealTimers();
});

describe("evaluateHomeAuthority", () => {
  it("denies vendor permission alone for a non-participant actor", () => {
    const decision = evaluateHomeAuthority(
      baseRequest({
        actorId: "vendor-bot",
        vendorPermissionClaimed: true,
      }),
      baseCtx(),
    );
    expect(decision.outcome).toBe("DENY");
    if (decision.outcome === "DENY") {
      expect(decision.code).toBe("VENDOR_PERMISSION_INSUFFICIENT");
    }
  });

  it("requires confirmation for TURN_ON at H3", () => {
    const pending = new Map<string, PendingConfirmation>();
    const decision = evaluateHomeAuthority(
      baseRequest(),
      baseCtx({ pendingConfirmations: pending }),
    );
    expect(decision.outcome).toBe("REQUIRE_CONFIRMATION");
    if (decision.outcome === "REQUIRE_CONFIRMATION") {
      expect(decision.confirmationToken).toBeTruthy();
      expect(pending.has(decision.confirmationToken)).toBe(true);
    }
  });

  it("allows after a valid confirmation token", () => {
    const pending = new Map<string, PendingConfirmation>();
    const request = baseRequest();
    const first = evaluateHomeAuthority(
      request,
      baseCtx({ pendingConfirmations: pending }),
    );
    expect(first.outcome).toBe("REQUIRE_CONFIRMATION");
    if (first.outcome !== "REQUIRE_CONFIRMATION") return;

    const second = evaluateHomeAuthority(
      { ...request, confirmationToken: first.confirmationToken },
      baseCtx({ pendingConfirmations: pending }),
    );
    expect(second.outcome).toBe("ALLOW");
  });

  it("denies expired confirmation tokens", () => {
    vi.useFakeTimers();
    const now = new Date("2026-01-01T00:00:00.000Z");
    vi.setSystemTime(now);
    const pending = new Map<string, PendingConfirmation>();
    const request = baseRequest();
    const first = evaluateHomeAuthority(
      request,
      baseCtx({ now, pendingConfirmations: pending }),
    );
    expect(first.outcome).toBe("REQUIRE_CONFIRMATION");
    if (first.outcome !== "REQUIRE_CONFIRMATION") return;

    vi.setSystemTime(new Date(now.getTime() + CONFIRMATION_TTL_MS + 1));
    const second = evaluateHomeAuthority(
      { ...request, confirmationToken: first.confirmationToken },
      baseCtx({
        now: new Date(now.getTime() + CONFIRMATION_TTL_MS + 1),
        pendingConfirmations: pending,
      }),
    );
    expect(second.outcome).toBe("DENY");
    if (second.outcome === "DENY") {
      expect(second.code).toBe("CONFIRMATION_EXPIRED");
    }
  });

  it("honours participant refusal of a confirmation", () => {
    const pending = new Map<string, PendingConfirmation>();
    const request = baseRequest();
    const first = evaluateHomeAuthority(
      request,
      baseCtx({ pendingConfirmations: pending }),
    );
    expect(first.outcome).toBe("REQUIRE_CONFIRMATION");
    if (first.outcome !== "REQUIRE_CONFIRMATION") return;
    refuseConfirmation(pending, first.confirmationToken);

    const second = evaluateHomeAuthority(
      { ...request, confirmationToken: first.confirmationToken },
      baseCtx({ pendingConfirmations: pending }),
    );
    expect(second.outcome).toBe("DENY");
    if (second.outcome === "DENY") {
      expect(second.code).toBe("PARTICIPANT_REFUSAL");
    }
  });

  it("denies expired delegations", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const delegation: DelegatedAuthority = {
      id: "del-1",
      participantId: "participant-1",
      delegateId: "worker-1",
      displayName: "Support worker",
      validFrom: "2026-05-01T00:00:00.000Z",
      validUntil: "2026-05-02T00:00:00.000Z",
      allowedCapabilityKinds: ["TURN_ON"],
      deniedCapabilityKinds: [],
      purpose: "Visit lighting",
      active: true,
    };
    const decision = evaluateHomeAuthority(
      baseRequest({
        actorId: "worker-1",
        delegationId: "del-1",
      }),
      baseCtx({ now, delegations: [delegation] }),
    );
    expect(decision.outcome).toBe("DENY");
    if (decision.outcome === "DENY") {
      expect(decision.code).toBe("DELEGATION_EXPIRED");
    }
  });

  it("blocks privacy zones outside allowed purpose", () => {
    const decision = evaluateHomeAuthority(
      baseRequest(),
      baseCtx({
        privacyZone: "HIGHLY_PRIVATE",
        allowedPrivacyZones: ["SHARED"],
      }),
    );
    expect(decision.outcome).toBe("DENY");
    if (decision.outcome === "DENY") {
      expect(decision.code).toBe("PRIVACY_ZONE_BLOCKED");
    }
  });

  it("allows bounded auto for pre-authorised LOW risk only", () => {
    const decision = evaluateHomeAuthority(
      baseRequest({ capabilityKind: "TURN_ON" }),
      baseCtx({
        participantAutonomyCeiling: "H4_BOUNDED_AUTO",
        preAuthorisedCapabilityKinds: ["TURN_ON"],
      }),
    );
    expect(decision.outcome).toBe("ALLOW");
  });

  it("never allows unsupported commission paths", () => {
    const decision = evaluateHomeAuthority(
      baseRequest({ capabilityKind: "COMMISSION_DEVICE" }),
      baseCtx({ participantAutonomyCeiling: "H5_ROUTINE_ORCHESTRATION" }),
    );
    expect(decision.outcome).toBe("DENY");
  });
});

describe("HomeActionBroker invariants", () => {
  it("never passes HomeActionRequest into adapter.execute", async () => {
    const execute = vi.fn(
      async (action: AuthorizedHomeAction): Promise<HomeActionReceipt> => ({
        id: randomUUID(),
        actionId: action.id,
        requestId: action.requestId,
        correlationId: action.correlationId,
        capabilityKind: action.capabilityKind,
        endpointId: action.endpointId,
        requestedBy: action.actorId,
        authorityBasis: action.authorityBasis,
        adapterId: action.adapterId,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        result: "SUCCEEDED",
        stateBefore: null,
        stateAfter: null,
        explanation: "mock",
        undoAvailable: false,
      }),
    );

    const adapter: HomeCapabilityAdapter = {
      id: "adapter:simulator",
      provider: "SIMULATOR",
      status: "READY",
      discover: async () => [],
      getState: async () => ({
        endpointId: "sim-hall-light",
        capabilityId: "TURN_ON",
        value: false,
        confidence: "KNOWN",
        observedAt: new Date().toISOString(),
        explanation: "mock",
      }),
      execute,
    };

    const broker = new HomeActionBroker(
      new Map([[adapter.id, adapter]]),
      () => adapter.id,
    );

    const result = await broker.proposeAndMaybeExecute(baseRequest(), {
      participantAutonomyCeiling: "H4_BOUNDED_AUTO",
      preAuthorisedCapabilityKinds: ["TURN_ON"],
    });

    expect(result.status).toBe("EXECUTED");
    expect(execute).toHaveBeenCalledTimes(1);
    const arg = execute.mock.calls[0]![0] as AuthorizedHomeAction;
    expect(arg).toHaveProperty("authorityBasis");
    expect(arg).toHaveProperty("authorizedAt");
    expect(arg).not.toHaveProperty("vendorPermissionClaimed");
    expect(arg).not.toHaveProperty("requestedAt");
  });

  it("denies non-simulator adapters while real device actions are off", async () => {
    const execute = vi.fn();
    const adapter: HomeCapabilityAdapter = {
      id: "adapter:matter",
      provider: "MATTER",
      status: "SCAFFOLDED",
      discover: async () => [],
      getState: async () => ({
        endpointId: "x",
        capabilityId: "TURN_ON",
        value: null,
        confidence: "UNAVAILABLE",
        observedAt: null,
        explanation: "scaffold",
      }),
      execute,
    };
    const broker = new HomeActionBroker(
      new Map([[adapter.id, adapter]]),
      () => adapter.id,
    );

    const result = await broker.proposeAndMaybeExecute(baseRequest(), {
      participantAutonomyCeiling: "H4_BOUNDED_AUTO",
      preAuthorisedCapabilityKinds: ["TURN_ON"],
    });
    expect(result.status).toBe("DENIED");
    expect(execute).not.toHaveBeenCalled();
  });
});

describe("simulator discovery and UNKNOWN preservation", () => {
  it("discovers a synthetic multi-zone home", async () => {
    const snap = await getHomeEnvironmentSnapshot();
    expect(snap.environment.claimState).toBe("SIMULATION");
    expect(snap.environment.zones.length).toBeGreaterThanOrEqual(4);
    expect(snap.endpoints.length).toBeGreaterThanOrEqual(8);
    expect(snap.endpoints.some((e) => e.category === "LIGHT")).toBe(true);
    expect(snap.endpoints.some((e) => e.category === "LOCK")).toBe(true);
  });

  it("keeps lift and charger confidence as UNKNOWN", async () => {
    const snap = await getHomeEnvironmentSnapshot();
    const lift = snap.endpoints.find((e) => e.category === "LIFT");
    const charger = snap.endpoints.find((e) => e.category === "CHARGER");
    expect(lift?.stateConfidence).toBe("UNKNOWN");
    expect(charger?.stateConfidence).toBe("UNKNOWN");
  });

  it("does not treat UNKNOWN as usable known state", () => {
    const unknown = normalizeCapabilityState({
      endpointId: "sim-building-lift",
      capabilityId: "REPORT_AVAILABILITY",
      value: null,
      confidence: "UNKNOWN",
      observedAt: null,
      explanation: "No reading",
    });
    expect(isUsableKnownState(unknown)).toBe(false);
  });
});

describe("simulator execution path", () => {
  it("executes bounded-auto TURN_ON on a light", async () => {
    const snap = await getHomeEnvironmentSnapshot();
    const light = snap.endpoints.find((e) => e.category === "LIGHT");
    expect(light).toBeTruthy();

    const result = await proposeHomeAction({
      participantId: "p1",
      actorId: "p1",
      endpointId: light!.id,
      capabilityKind: "TURN_ON",
      participantAutonomyCeiling: "H4_BOUNDED_AUTO",
      preAuthorisedCapabilityKinds: ["TURN_ON"],
    });
    expect(result.status).toBe("EXECUTED");
  });

  it("denies vendor-only non-participant proposes", async () => {
    const snap = await getHomeEnvironmentSnapshot();
    const light = snap.endpoints.find((e) => e.category === "LIGHT")!;
    const result = await proposeHomeAction({
      participantId: "p1",
      actorId: "vendor",
      endpointId: light.id,
      capabilityKind: "TURN_ON",
      vendorPermissionClaimed: true,
      participantAutonomyCeiling: "H4_BOUNDED_AUTO",
    });
    expect(result.status).toBe("DENIED");
  });
});

describe("routines", () => {
  it("lists deterministic P0 routines", () => {
    const routines = listSimulatorRoutines();
    const ids = routines.map((r) => r.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "GOING_OUT",
        "COMING_HOME",
        "SUPPORT_WORKER_ARRIVING",
        "GOING_TO_BED",
      ]),
    );
  });

  it("GOING_OUT reports unknown charger/lift state", async () => {
    const evaluation = await evaluateRoutineForSimulator("GOING_OUT");
    expect(evaluation.outcome).toBe("HAS_UNKNOWN_STATE");
  });
});

describe("vendor mapper fixtures", () => {
  it("maps Matter OnOff cluster to TURN_ON", () => {
    expect(mapMatterClusterToCapability("OnOff")).toBe("TURN_ON");
    expect(mapMatterClusterToCapability("NoSuchCluster")).toBe("UNKNOWN");
  });

  it("maps Google OnOff trait to TURN_ON", () => {
    expect(mapGoogleTraitToCapability("OnOff")).toBe("TURN_ON");
    expect(mapGoogleTraitToCapability("UnsupportedCustomTrait")).toBe("UNKNOWN");
  });

  it("maps Alexa intents to proposals without execute semantics", () => {
    const proposal = mapAlexaIntentToProposal(
      ALEXA_INTENT_FIXTURES[0]!.intentName,
    );
    expect(proposal?.proposedRoutineId).toBe("GOING_OUT");
  });
});
