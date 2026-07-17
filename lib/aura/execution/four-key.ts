import { auraFlags } from "../feature-flags";
import { isProhibitedAction } from "../authority/ladder";
import {
  requireProposal,
  verifyAuraActionProposal,
  verifyAuraProposalHash,
  runPreflight,
} from "../proposals";
import { requireMission } from "../mission/store";
import { assertMissionNotStopped } from "../stop";
import {
  getExecutionApproval,
  validateApprovalForExecution,
} from "./approval";
import { isActionExecutionEnabled } from "./flags";
import { resolveExecutionService } from "./registry";
import type { AuraActionExecution, FourKeyResult } from "./types";

export async function runFourKeyRule(input: {
  execution: AuraActionExecution;
  participantId: string;
  approvalId: string;
  postDispatch?: boolean;
  serviceReceiptReceived?: boolean;
  postconditions?: AuraActionExecution["postconditions"];
}): Promise<FourKeyResult[]> {
  const proposal = requireProposal(input.execution.proposalId);
  const mission = requireMission(proposal.missionId);
  const approval = getExecutionApproval(input.approvalId);
  const results: FourKeyResult[] = [];

  // KEY 1: Participant mandate
  const k1Failures: string[] = [];
  try {
    if (mission.participantId !== input.participantId) {
      k1Failures.push("participant_mismatch");
    }
    assertMissionNotStopped(mission);
    if (mission.status === "stopped" || mission.stopState) {
      k1Failures.push("mission_stopped");
    }
    if (mission.status === "human_review_required") {
      k1Failures.push("mission_human_review_required");
    }
    if (!approval) k1Failures.push("approval_missing");
    else {
      validateApprovalForExecution(
        approval,
        proposal.id,
        proposal.version,
        proposal.proposalHash,
        input.participantId,
      );
    }
  } catch (e) {
    k1Failures.push(e instanceof Error ? e.message : "mandate_failed");
  }
  results.push({
    key: "participant_mandate",
    passed: k1Failures.length === 0,
    failures: k1Failures,
    warnings: [],
  });

  // KEY 2: Policy permission
  const k2Failures: string[] = [];
  const k2Warnings: string[] = [];
  if (isProhibitedAction(proposal.actionType)) {
    k2Failures.push("prohibited_action");
  }
  if (!isActionExecutionEnabled(proposal.actionType)) {
    k2Failures.push("action_execution_disabled");
  }
  if (auraFlags.physicalActions || auraFlags.writeExecution) {
    k2Failures.push("unsafe_global_flags");
  }
  const preflight = runPreflight(proposal.actionType, proposal.payload);
  if (!preflight.schemaValid) k2Failures.push("schema_invalid");
  if (preflight.errors.length) k2Failures.push(...preflight.errors);
  results.push({
    key: "policy_permission",
    passed: k2Failures.length === 0,
    failures: k2Failures,
    warnings: k2Warnings,
  });

  // KEY 3: Application preconditions
  const k3Failures: string[] = [];
  try {
    verifyAuraActionProposal(proposal.id);
    if (!verifyAuraProposalHash(proposal)) {
      k3Failures.push("proposal_hash_mismatch");
    }
    if (Date.parse(mission.plan?.expiresAt ?? "0") <= Date.now()) {
      k3Failures.push("plan_expired");
    }
    const service = resolveExecutionService(proposal.actionType);
    const pf = await service.preflight({
      missionId: mission.id,
      proposalId: proposal.id,
      participantId: input.participantId,
      actionType: proposal.actionType,
    });
    if (!pf.passed) k3Failures.push(...pf.errors);
    if (!pf.serviceAvailable) k3Failures.push("service_unavailable");

    const duplicate = [...(input.execution.recordsCreated ?? [])];
    if (
      input.postDispatch &&
      duplicate.length === 0 &&
      input.serviceReceiptReceived
    ) {
      k3Failures.push("no_records_created");
    }
  } catch (e) {
    k3Failures.push(e instanceof Error ? e.message : "precondition_failed");
  }
  results.push({
    key: "application_preconditions",
    passed: k3Failures.length === 0,
    failures: k3Failures,
    warnings: [],
  });

  // KEY 4: Reality verification (post-dispatch only)
  const k4Failures: string[] = [];
  if (input.postDispatch) {
    if (!input.serviceReceiptReceived) {
      k4Failures.push("no_service_receipt");
    }
    const post = input.postconditions ?? [];
    const failed = post.filter((p) => !p.passed);
    if (failed.length) {
      k4Failures.push(...failed.map((f) => f.condition));
    }
    if (!input.execution.applicationReceiptId && input.serviceReceiptReceived) {
      k4Failures.push("receipt_reference_missing");
    }
  }
  results.push({
    key: "reality_verification",
    passed: input.postDispatch ? k4Failures.length === 0 : true,
    failures: k4Failures,
    warnings: [],
  });

  return results;
}

export function allFourKeysPassed(results: FourKeyResult[]): boolean {
  return results.every((r) => r.passed);
}

export function modelCannotOverrideFourKey(): true {
  return true;
}
