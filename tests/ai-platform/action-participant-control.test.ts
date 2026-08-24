import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import {
  approveActionProposal,
  createActionProposal,
  rejectActionProposal,
} from "@/lib/ai/platform/actions/approvals";
import {
  clearTestActionAdapters,
  registerTestActionAdapter,
} from "@/lib/ai/platform/actions/adapters";
import { executeApprovedAction } from "@/lib/ai/platform/actions/executor";
import { evaluateActionPolicy } from "@/lib/ai/platform/actions/policy";
import { getMapAbleActionDefinition } from "@/lib/ai/platform/actions/registry";
import { clearActionStore } from "@/lib/ai/platform/actions/store";
import { clearReplayStore } from "@/lib/ai/platform/actions/replay";
import { AUTHORITY_CEILINGS } from "@/lib/ai/platform/types/authority";
import type { CurrentUser } from "@/lib/auth/current-user";

const fakeUser = { id: "p1" } as CurrentUser;

/**
 * Twenty-one Prompt 02 invariants for participant control and safety.
 */
describe("Action participant control invariants", () => {
  beforeEach(() => {
    clearActionStore();
    clearReplayStore();
    clearTestActionAdapters();
    process.env.MAPABLE_ACTION_KERNEL_ENABLED = "true";
    process.env.MAPABLE_ACTION_HUMAN_COORDINATION_ENABLED = "true";
    process.env.MAPABLE_ACTION_CARE_REQUEST_ENABLED = "true";
    process.env.MAPABLE_ACTION_TRANSPORT_REQUEST_ENABLED = "true";
    process.env.MAPABLE_ACTION_SAVE_PREFERENCE_ENABLED = "true";
    process.env.MAPABLE_ACTION_PROVIDER_MESSAGE_ENABLED = "true";
    registerTestActionAdapter("request_human_coordination", async () => ({
      entityType: "HumanCoordinationRequest",
      entityId: "c1",
      outcomeDetail: "requested",
    }));
  });

  afterEach(() => {
    clearTestActionAdapters();
    for (const key of [
      "MAPABLE_ACTION_KERNEL_ENABLED",
      "MAPABLE_ACTION_HUMAN_COORDINATION_ENABLED",
      "MAPABLE_ACTION_CARE_REQUEST_ENABLED",
      "MAPABLE_ACTION_TRANSPORT_REQUEST_ENABLED",
      "MAPABLE_ACTION_SAVE_PREFERENCE_ENABLED",
      "MAPABLE_ACTION_PROVIDER_MESSAGE_ENABLED",
      "MAPABLE_ACTION_KERNEL_KILL_SWITCH",
    ]) {
      delete process.env[key];
    }
  });

  it("1. AI proposes; does not silently execute", () => {
    const proposal = createActionProposal({
      missionId: randomUUID(),
      traceId: randomUUID(),
      actionKey: "request_human_coordination",
      participantId: "p1",
      actorId: "p1",
      payload: {
        category: "general_coordination",
        title: "Help",
        summary: "Need coordination",
      },
      informationToShare: [],
      purpose: "Ask for help",
      consentScopes: [],
    });
    expect(proposal.status).toBe("proposed");
  });

  it("2. Policy validates before approval", () => {
    delete process.env.MAPABLE_ACTION_HUMAN_COORDINATION_ENABLED;
    const decision = evaluateActionPolicy({
      actionKey: "request_human_coordination",
      payload: {
        category: "general_coordination",
        title: "Help",
        summary: "Need coordination",
      },
      consentScopes: [],
    });
    expect(decision.allowed).toBe(false);
  });

  it("3. Participant can reject without side effects", () => {
    const proposal = createActionProposal({
      missionId: randomUUID(),
      traceId: randomUUID(),
      actionKey: "request_human_coordination",
      participantId: "p1",
      actorId: "p1",
      payload: {
        category: "general_coordination",
        title: "Help",
        summary: "Need coordination",
      },
      informationToShare: [],
      purpose: "Ask for help",
      consentScopes: [],
    });
    expect(rejectActionProposal({ proposalId: proposal.proposalId, actorId: "p1" }).status).toBe(
      "rejected",
    );
  });

  it("4. Approval binds to payloadHash", () => {
    const proposal = createActionProposal({
      missionId: randomUUID(),
      traceId: randomUUID(),
      actionKey: "request_human_coordination",
      participantId: "p1",
      actorId: "p1",
      payload: {
        category: "general_coordination",
        title: "Help",
        summary: "Need coordination",
      },
      informationToShare: ["goal"],
      purpose: "Ask for help",
      consentScopes: [],
    });
    const binding = approveActionProposal({
      proposalId: proposal.proposalId,
      actorId: "p1",
      actorType: "participant",
      consentScopes: [],
      confirmedInformationToShare: ["goal"],
    });
    expect(binding.payloadHash).toBe(proposal.payloadHash);
  });

  it("5. Execute never accepts client payload", async () => {
    const proposal = createActionProposal({
      missionId: randomUUID(),
      traceId: randomUUID(),
      actionKey: "request_human_coordination",
      participantId: "p1",
      actorId: "p1",
      payload: {
        category: "general_coordination",
        title: "Help",
        summary: "Need coordination",
      },
      informationToShare: [],
      purpose: "Ask for help",
      consentScopes: [],
    });
    const binding = approveActionProposal({
      proposalId: proposal.proposalId,
      actorId: "p1",
      actorType: "participant",
      consentScopes: [],
      confirmedInformationToShare: [],
    });
    const result = await executeApprovedAction(
      {
        proposalId: proposal.proposalId,
        approvalId: binding.approvalId,
        nonce: binding.nonce,
      },
      { participantId: "p1", actorId: "p1", user: fakeUser },
    );
    expect(result.payloadHash).toBe(proposal.payloadHash);
  });

  it("6. Replay of same approval returns idempotent result; foreign nonce fails", async () => {
    const proposal = createActionProposal({
      missionId: randomUUID(),
      traceId: randomUUID(),
      actionKey: "request_human_coordination",
      participantId: "p1",
      actorId: "p1",
      payload: {
        category: "general_coordination",
        title: "Help",
        summary: "Need coordination",
      },
      informationToShare: [],
      purpose: "Ask for help",
      consentScopes: [],
    });
    const binding = approveActionProposal({
      proposalId: proposal.proposalId,
      actorId: "p1",
      actorType: "participant",
      consentScopes: [],
      confirmedInformationToShare: [],
    });
    const first = await executeApprovedAction(
      {
        proposalId: proposal.proposalId,
        approvalId: binding.approvalId,
        nonce: binding.nonce,
      },
      { participantId: "p1", actorId: "p1", user: fakeUser },
    );
    const second = await executeApprovedAction(
      {
        proposalId: proposal.proposalId,
        approvalId: binding.approvalId,
        nonce: binding.nonce,
      },
      { participantId: "p1", actorId: "p1", user: fakeUser },
    );
    expect(second.resultId).toBe(first.resultId);
    await expect(
      executeApprovedAction(
        {
          proposalId: proposal.proposalId,
          approvalId: binding.approvalId,
          nonce: "foreign-nonce-not-bound",
        },
        { participantId: "p1", actorId: "p1", user: fakeUser },
      ),
    ).rejects.toThrow(/NONCE_MISMATCH/);
  });

  it("7. Outcome labels are honest (submitted not booked)", () => {
    expect(
      getMapAbleActionDefinition("submit_transport_request").successOutcomeLabel,
    ).not.toMatch(/booked/i);
  });

  it("8. Care outcome is submitted not assigned", () => {
    expect(
      getMapAbleActionDefinition("submit_care_request").successOutcomeLabel,
    ).not.toMatch(/assigned/i);
  });

  it("9. Authority ceilings taxonomy unchanged", () => {
    expect(AUTHORITY_CEILINGS).toContain("SUGGEST_WITH_PARTICIPANT_APPROVAL");
    expect(AUTHORITY_CEILINGS).toContain("DETERMINISTIC_EXECUTE_VIA_SERVICE");
  });

  it("10. Kill switch blocks operations", () => {
    process.env.MAPABLE_ACTION_KERNEL_KILL_SWITCH = "true";
    expect(
      evaluateActionPolicy({
        actionKey: "request_human_coordination",
        payload: {
          category: "general_coordination",
          title: "Help",
          summary: "Need coordination",
        },
        consentScopes: [],
      }).allowed,
    ).toBe(false);
  });

  it("11. Master flag fail-closed by default when unset", () => {
    delete process.env.MAPABLE_ACTION_KERNEL_ENABLED;
    expect(
      evaluateActionPolicy({
        actionKey: "request_human_coordination",
        payload: {
          category: "general_coordination",
          title: "Help",
          summary: "Need coordination",
        },
        consentScopes: [],
      }).reasonCode,
    ).toBe("action_kernel_disabled");
  });

  it("12. Per-action flags are independent", () => {
    delete process.env.MAPABLE_ACTION_CARE_REQUEST_ENABLED;
    expect(
      evaluateActionPolicy({
        actionKey: "submit_care_request",
        payload: {
          requestType: "appointment_support",
          title: "Support",
          description: "Help",
        },
        consentScopes: ["care.manage"],
      }).reasonCode,
    ).toBe("action_type_disabled");
  });

  it("13. Consent scopes enforced for preference save", () => {
    expect(
      evaluateActionPolicy({
        actionKey: "save_participant_preference",
        payload: {
          key: "preferred_contact_method",
          value: "sms",
        },
        consentScopes: [],
      }).reasonCode,
    ).toBe("missing_consent");
  });

  it("14. Preference save allowed with profile.write", () => {
    expect(
      evaluateActionPolicy({
        actionKey: "save_participant_preference",
        payload: {
          key: "preferred_contact_method",
          value: "sms",
        },
        consentScopes: ["profile.write"],
      }).allowed,
    ).toBe(true);
  });

  it("15. Provider message requires messages.send", () => {
    expect(
      evaluateActionPolicy({
        actionKey: "send_provider_message",
        payload: {
          conversationId: "c1",
          body: "Hello",
        },
        consentScopes: [],
      }).reasonCode,
    ).toBe("missing_consent");
  });

  it("16. Transport request requires transport.manage", () => {
    expect(
      evaluateActionPolicy({
        actionKey: "submit_transport_request",
        payload: {
          pickupAddress: "1 Street",
          dropoffAddress: "2 Road",
          scheduledStart: new Date(Date.now() + 86_400_000).toISOString(),
        },
        consentScopes: [],
      }).reasonCode,
    ).toBe("missing_consent");
  });

  it("17. Participant mismatch blocks approval", () => {
    const proposal = createActionProposal({
      missionId: randomUUID(),
      traceId: randomUUID(),
      actionKey: "request_human_coordination",
      participantId: "p1",
      actorId: "p1",
      payload: {
        category: "general_coordination",
        title: "Help",
        summary: "Need coordination",
      },
      informationToShare: [],
      purpose: "Ask for help",
      consentScopes: [],
    });
    expect(() =>
      approveActionProposal({
        proposalId: proposal.proposalId,
        actorId: "intruder",
        actorType: "participant",
        consentScopes: [],
        confirmedInformationToShare: [],
      }),
    ).toThrow(/PARTICIPANT_MISMATCH/);
  });

  it("18. Consequence kinds are declared on registry entries", () => {
    for (const key of [
      "save_participant_preference",
      "request_human_coordination",
      "submit_care_request",
      "submit_transport_request",
      "send_provider_message",
    ] as const) {
      expect(getMapAbleActionDefinition(key).consequenceKinds.length).toBeGreaterThan(0);
    }
  });

  it("19. Required approvals always include participant for Phase 02", () => {
    for (const key of [
      "save_participant_preference",
      "request_human_coordination",
      "submit_care_request",
      "submit_transport_request",
      "send_provider_message",
    ] as const) {
      expect(getMapAbleActionDefinition(key).requiredApprovals).toContain("participant");
    }
  });

  it("20. Idempotency key is derived from proposal+approval+nonce", async () => {
    const proposal = createActionProposal({
      missionId: randomUUID(),
      traceId: randomUUID(),
      actionKey: "request_human_coordination",
      participantId: "p1",
      actorId: "p1",
      payload: {
        category: "general_coordination",
        title: "Help",
        summary: "Need coordination",
      },
      informationToShare: [],
      purpose: "Ask for help",
      consentScopes: [],
    });
    const binding = approveActionProposal({
      proposalId: proposal.proposalId,
      actorId: "p1",
      actorType: "participant",
      consentScopes: [],
      confirmedInformationToShare: [],
    });
    const result = await executeApprovedAction(
      {
        proposalId: proposal.proposalId,
        approvalId: binding.approvalId,
        nonce: binding.nonce,
      },
      { participantId: "p1", actorId: "p1", user: fakeUser },
    );
    expect(result.idempotencyKey).toMatch(/^[a-f0-9]{64}$/);
  });

  it("21. No parallel authority expansion — action uses existing ceilings only", () => {
    const def = getMapAbleActionDefinition("submit_care_request");
    expect(AUTHORITY_CEILINGS.includes(def.authorityCeiling)).toBe(true);
  });
});
