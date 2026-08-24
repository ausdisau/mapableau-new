import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  computeEffectiveActionAuthority,
  evaluateActionPolicy,
} from "@/lib/ai/platform/actions/policy";
import { clearActionStore } from "@/lib/ai/platform/actions/store";
import { clearReplayStore } from "@/lib/ai/platform/actions/replay";

describe("Action policy", () => {
  beforeEach(() => {
    clearActionStore();
    clearReplayStore();
    process.env.MAPABLE_ACTION_KERNEL_ENABLED = "true";
    process.env.MAPABLE_ACTION_HUMAN_COORDINATION_ENABLED = "true";
    process.env.MAPABLE_ACTION_CARE_REQUEST_ENABLED = "true";
    delete process.env.MAPABLE_ACTION_KERNEL_KILL_SWITCH;
    delete process.env.MAPABLE_AI_GLOBAL_KILL_SWITCH;
  });

  afterEach(() => {
    delete process.env.MAPABLE_ACTION_KERNEL_ENABLED;
    delete process.env.MAPABLE_ACTION_HUMAN_COORDINATION_ENABLED;
    delete process.env.MAPABLE_ACTION_CARE_REQUEST_ENABLED;
    delete process.env.MAPABLE_ACTION_KERNEL_KILL_SWITCH;
  });

  it("fails closed when kernel is disabled", () => {
    delete process.env.MAPABLE_ACTION_KERNEL_ENABLED;
    const decision = evaluateActionPolicy({
      actionKey: "request_human_coordination",
      payload: {
        category: "general_coordination",
        title: "Need help",
        summary: "Please coordinate",
      },
      consentScopes: [],
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("action_kernel_disabled");
  });

  it("fails closed on kill switch", () => {
    process.env.MAPABLE_ACTION_KERNEL_KILL_SWITCH = "true";
    const decision = evaluateActionPolicy({
      actionKey: "request_human_coordination",
      payload: {
        category: "general_coordination",
        title: "Need help",
        summary: "Please coordinate",
      },
      consentScopes: [],
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("action_kernel_kill_switch");
  });

  it("requires per-action feature flag", () => {
    delete process.env.MAPABLE_ACTION_CARE_REQUEST_ENABLED;
    const decision = evaluateActionPolicy({
      actionKey: "submit_care_request",
      payload: {
        requestType: "appointment_support",
        title: "Support",
        description: "Help at appointment",
      },
      consentScopes: ["care.manage"],
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("action_type_disabled");
  });

  it("requires consent scopes for care requests", () => {
    const decision = evaluateActionPolicy({
      actionKey: "submit_care_request",
      payload: {
        requestType: "appointment_support",
        title: "Support",
        description: "Help at appointment",
      },
      consentScopes: [],
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("missing_consent");
  });

  it("rejects invalid payloads", () => {
    const decision = evaluateActionPolicy({
      actionKey: "submit_care_request",
      payload: { title: "x" },
      consentScopes: ["care.manage"],
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("invalid_payload");
  });

  it("computes effectiveAuthority as min of mission, agent, action, actor", () => {
    const effective = computeEffectiveActionAuthority({
      missionAuthority: "SUGGEST_WITH_PARTICIPANT_APPROVAL",
      agentAuthority: "DRAFT_ONLY",
      actionKey: "request_human_coordination",
      actorAuthority: "DETERMINISTIC_EXECUTE_VIA_SERVICE",
    });
    expect(effective).toBe("DRAFT_ONLY");
  });

  it("denies when effective authority is below participant-approval floor", () => {
    const decision = evaluateActionPolicy({
      actionKey: "request_human_coordination",
      payload: {
        category: "general_coordination",
        title: "Need help",
        summary: "Please coordinate",
      },
      consentScopes: [],
      missionAuthority: "READ_ONLY_EXPLAIN",
      actorAuthority: "READ_ONLY_EXPLAIN",
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("authority_insufficient");
  });
});
