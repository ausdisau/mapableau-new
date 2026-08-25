import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import {
  approveActionProposal,
  createActionProposal,
} from "@/lib/ai/platform/actions/approvals";
import { executeApprovedAction } from "@/lib/ai/platform/actions/executor";
import {
  clearTestActionAdapters,
  registerTestActionAdapter,
} from "@/lib/ai/platform/actions/adapters";
import { clearActionStore } from "@/lib/ai/platform/actions/store";
import {
  clearReplayStore,
  consumeNonce,
  isNonceConsumed,
} from "@/lib/ai/platform/actions/replay";
import type { CurrentUser } from "@/lib/auth/current-user";

const fakeUser = { id: "p1" } as CurrentUser;

function enableKernel() {
  process.env.MAPABLE_ACTION_KERNEL_ENABLED = "true";
  process.env.MAPABLE_ACTION_HUMAN_COORDINATION_ENABLED = "true";
}

describe("Action replay protection", () => {
  beforeEach(() => {
    clearActionStore();
    clearReplayStore();
    clearTestActionAdapters();
    enableKernel();
    registerTestActionAdapter("request_human_coordination", async () => ({
      entityType: "HumanCoordinationRequest",
      entityId: "coord-1",
      outcomeDetail: "Human coordination requested",
    }));
  });

  afterEach(() => {
    clearTestActionAdapters();
    delete process.env.MAPABLE_ACTION_KERNEL_ENABLED;
    delete process.env.MAPABLE_ACTION_HUMAN_COORDINATION_ENABLED;
  });

  it("consumes nonce so it cannot be reused", () => {
    const nonce = randomUUID();
    expect(consumeNonce(nonce)).toBe(true);
    expect(isNonceConsumed(nonce)).toBe(true);
    expect(consumeNonce(nonce)).toBe(false);
  });

  it("returns idempotent result on replay of the same approval+nonce", async () => {
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

    const first = await executeApprovedAction(
      {
        proposalId: proposal.proposalId,
        approvalId: binding.approvalId,
        nonce: binding.nonce,
      },
      { participantId: "p1", actorId: "p1", user: fakeUser },
    );
    expect(first.status).toBe("completed");

    const second = await executeApprovedAction(
      {
        proposalId: proposal.proposalId,
        approvalId: binding.approvalId,
        nonce: binding.nonce,
      },
      { participantId: "p1", actorId: "p1", user: fakeUser },
    );
    expect(second.status).toBe("completed");
    expect(second.resultId).toBe(first.resultId);
    expect(second.missionFeedback).toMatch(/idempotent/i);
  });

  it("rejects when nonce was consumed outside the successful completion path", async () => {
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

    expect(consumeNonce(binding.nonce)).toBe(true);

    await expect(
      executeApprovedAction(
        {
          proposalId: proposal.proposalId,
          approvalId: binding.approvalId,
          nonce: binding.nonce,
        },
        { participantId: "p1", actorId: "p1", user: fakeUser },
      ),
    ).rejects.toThrow(/NONCE_ALREADY_CONSUMED/);
  });

  it("rejects execute when nonce does not match binding", async () => {
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

    await expect(
      executeApprovedAction(
        {
          proposalId: proposal.proposalId,
          approvalId: binding.approvalId,
          nonce: "wrong-nonce-value-here",
        },
        { participantId: "p1", actorId: "p1", user: fakeUser },
      ),
    ).rejects.toThrow(/NONCE_MISMATCH/);
  });
});
