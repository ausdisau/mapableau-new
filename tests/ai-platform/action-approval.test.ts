import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import {
  approveActionProposal,
  createActionProposal,
  rejectActionProposal,
} from "@/lib/ai/platform/actions/approvals";
import { hashActionPayload, hashInformationToShare } from "@/lib/ai/platform/actions/envelope";
import { clearActionStore, getActionProposal } from "@/lib/ai/platform/actions/store";
import { clearReplayStore } from "@/lib/ai/platform/actions/replay";

function enableKernel() {
  process.env.MAPABLE_ACTION_KERNEL_ENABLED = "true";
  process.env.MAPABLE_ACTION_HUMAN_COORDINATION_ENABLED = "true";
  delete process.env.MAPABLE_ACTION_KERNEL_KILL_SWITCH;
}

describe("Action approval binding", () => {
  beforeEach(() => {
    clearActionStore();
    clearReplayStore();
    enableKernel();
  });

  afterEach(() => {
    delete process.env.MAPABLE_ACTION_KERNEL_ENABLED;
    delete process.env.MAPABLE_ACTION_HUMAN_COORDINATION_ENABLED;
  });

  it("binds approval to exact payloadHash and issues a nonce", () => {
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
      informationToShare: ["goal summary"],
      purpose: "Request human help",
      consentScopes: [],
    });

    const binding = approveActionProposal({
      proposalId: proposal.proposalId,
      actorId: "p1",
      actorType: "participant",
      consentScopes: [],
      confirmedInformationToShare: ["goal summary"],
    });

    expect(binding.payloadHash).toBe(proposal.payloadHash);
    expect(binding.nonce.length).toBeGreaterThan(10);
    expect(binding.approvedInformationToShareHash).toBe(
      hashInformationToShare(["goal summary"]),
    );
    expect(getActionProposal(proposal.proposalId)?.status).toBe("approved");
  });

  it("rejects approval from a different participant", () => {
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

    expect(() =>
      approveActionProposal({
        proposalId: proposal.proposalId,
        actorId: "other",
        actorType: "participant",
        consentScopes: [],
        confirmedInformationToShare: [],
      }),
    ).toThrow(/PARTICIPANT_MISMATCH/);
  });

  it("rejects a proposal without executing", () => {
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
    const rejected = rejectActionProposal({
      proposalId: proposal.proposalId,
      actorId: "p1",
    });
    expect(rejected.status).toBe("rejected");
  });

  it("uses deterministic payload hashing independent of key order", () => {
    expect(hashActionPayload({ b: 2, a: 1 })).toBe(hashActionPayload({ a: 1, b: 2 }));
  });
});
