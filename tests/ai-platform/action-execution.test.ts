import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import {
  approveActionProposal,
  createActionProposal,
} from "@/lib/ai/platform/actions/approvals";
import {
  clearTestActionAdapters,
  registerTestActionAdapter,
} from "@/lib/ai/platform/actions/adapters";
import {
  executeApprovedAction,
  prepareKernelProposalFromMission,
} from "@/lib/ai/platform/actions/executor";
import {
  appendMissionActionResult,
  clearMissionActionResults,
  listMissionActionResults,
} from "@/lib/ai/platform/actions/result";
import { clearActionStore } from "@/lib/ai/platform/actions/store";
import { clearReplayStore } from "@/lib/ai/platform/actions/replay";
import { planMission, clearMissionPlanStore } from "@/lib/ai/platform/missions";
import type { CurrentUser } from "@/lib/auth/current-user";

const fakeUser = { id: "p1" } as CurrentUser;

function enableAll() {
  process.env.MAPABLE_ACTION_KERNEL_ENABLED = "true";
  process.env.MAPABLE_ACTION_HUMAN_COORDINATION_ENABLED = "true";
  process.env.MAPABLE_ACTION_CARE_REQUEST_ENABLED = "true";
  process.env.MAPABLE_ACTION_TRANSPORT_REQUEST_ENABLED = "true";
  process.env.MAPABLE_ACTION_SAVE_PREFERENCE_ENABLED = "true";
  process.env.MAPABLE_ACTION_PROVIDER_MESSAGE_ENABLED = "true";
  process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED = "true";
}

describe("Action execution", () => {
  beforeEach(() => {
    clearActionStore();
    clearReplayStore();
    clearMissionActionResults();
    clearMissionPlanStore();
    clearTestActionAdapters();
    enableAll();
    registerTestActionAdapter("request_human_coordination", async () => ({
      entityType: "HumanCoordinationRequest",
      entityId: "coord-1",
      outcomeDetail: "Human coordination requested",
    }));
    registerTestActionAdapter("submit_care_request", async () => ({
      entityType: "CareRequest",
      entityId: "care-1",
      outcomeDetail: "Care request submitted for provider review",
    }));
    registerTestActionAdapter("submit_transport_request", async () => ({
      entityType: "TransportTrip",
      entityId: "trip-1",
      outcomeDetail: "Transport request submitted for provider review",
    }));
  });

  afterEach(() => {
    clearTestActionAdapters();
    delete process.env.MAPABLE_ACTION_KERNEL_ENABLED;
    delete process.env.MAPABLE_ACTION_HUMAN_COORDINATION_ENABLED;
    delete process.env.MAPABLE_ACTION_CARE_REQUEST_ENABLED;
    delete process.env.MAPABLE_ACTION_TRANSPORT_REQUEST_ENABLED;
    delete process.env.MAPABLE_ACTION_SAVE_PREFERENCE_ENABLED;
    delete process.env.MAPABLE_ACTION_PROVIDER_MESSAGE_ENABLED;
    delete process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED;
  });

  it("executes only with proposalId + approvalId + nonce (no client payload)", async () => {
    const proposal = createActionProposal({
      missionId: randomUUID(),
      traceId: randomUUID(),
      actionKey: "request_human_coordination",
      participantId: "p1",
      actorId: "p1",
      payload: {
        category: "general_coordination",
        title: "Need coordinator",
        summary: "Please help coordinate support",
      },
      informationToShare: [],
      purpose: "Request human help",
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

    expect(result.status).toBe("completed");
    expect(result.missionFeedback).toMatch(/Human coordination requested/i);
    expect(result.outcomeLabel).toBe("Human coordination requested");
  });

  it("refuses execution without approval", async () => {
    const proposal = createActionProposal({
      missionId: randomUUID(),
      traceId: randomUUID(),
      actionKey: "request_human_coordination",
      participantId: "p1",
      actorId: "p1",
      payload: {
        category: "general_coordination",
        title: "Need coordinator",
        summary: "Please help coordinate support",
      },
      informationToShare: [],
      purpose: "Request human help",
      consentScopes: [],
    });

    await expect(
      executeApprovedAction(
        {
          proposalId: proposal.proposalId,
          approvalId: randomUUID(),
          nonce: randomUUID(),
        },
        { participantId: "p1", actorId: "p1", user: fakeUser },
      ),
    ).rejects.toThrow(/APPROVAL_BINDING_INVALID/);
  });

  it("feeds honest outcomes back to mission (submitted not booked)", async () => {
    const proposal = createActionProposal({
      missionId: randomUUID(),
      traceId: randomUUID(),
      actionKey: "submit_transport_request",
      participantId: "p1",
      actorId: "p1",
      payload: {
        pickupAddress: "1 Example Street",
        dropoffAddress: "2 Clinic Road",
        scheduledStart: new Date(Date.now() + 86_400_000).toISOString(),
      },
      informationToShare: ["pickup"],
      purpose: "Submit transport request",
      consentScopes: ["transport.manage"],
    });
    const binding = approveActionProposal({
      proposalId: proposal.proposalId,
      actorId: "p1",
      actorType: "participant",
      consentScopes: ["transport.manage"],
      confirmedInformationToShare: ["pickup"],
    });
    const result = await executeApprovedAction(
      {
        proposalId: proposal.proposalId,
        approvalId: binding.approvalId,
        nonce: binding.nonce,
      },
      { participantId: "p1", actorId: "p1", user: fakeUser },
    );
    appendMissionActionResult(proposal.missionId, result);
    expect(result.missionFeedback.toLowerCase()).toContain("submitted");
    expect(result.missionFeedback.toLowerCase()).not.toContain("booked");
    expect(listMissionActionResults(proposal.missionId)).toHaveLength(1);
  });

  it("integrates interview mission proposals into the kernel", () => {
    const plan = planMission({
      actorId: "p1",
      participantId: "p1",
      objective:
        "I have a job interview tomorrow at 10am. I need help getting ready and I need wheelchair-accessible transport.",
      requestedUseOfAccessibilityProfile: false,
      plainLanguage: true,
      consentScopes: ["care.manage", "transport.manage"],
      source: "participant_text",
    });

    const transport = plan.actionProposals.find(
      (p) => p.action === "prepare_transport_request",
    );
    expect(transport).toBeTruthy();

    const kernelProposal = prepareKernelProposalFromMission({
      missionProposal: transport!,
      missionId: plan.missionId,
      traceId: plan.traceId,
      participantId: "p1",
      actorId: "p1",
      consentScopes: ["transport.manage"],
    });

    expect(kernelProposal?.actionKey).toBe("submit_transport_request");
    expect(kernelProposal?.status).toBe("proposed");
    expect(kernelProposal?.payloadHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
