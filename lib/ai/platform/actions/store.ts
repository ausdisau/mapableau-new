import type { ApprovalBinding, MapAbleActionProposal } from "./types";

const proposals = new Map<string, MapAbleActionProposal>();
const approvals = new Map<string, ApprovalBinding>();

/** In-memory proposal store — durable persistence deferred to Prompt 02A if required. */
export function saveActionProposal(proposal: MapAbleActionProposal): void {
  proposals.set(proposal.proposalId, proposal);
}

export function getActionProposal(
  proposalId: string,
): MapAbleActionProposal | null {
  return proposals.get(proposalId) ?? null;
}

export function updateActionProposal(
  proposalId: string,
  patch: Partial<MapAbleActionProposal>,
): MapAbleActionProposal | null {
  const existing = proposals.get(proposalId);
  if (!existing) return null;
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  proposals.set(proposalId, updated);
  return updated;
}

export function saveApprovalBinding(binding: ApprovalBinding): void {
  approvals.set(binding.approvalId, binding);
}

export function getApprovalBinding(
  approvalId: string,
): ApprovalBinding | null {
  return approvals.get(approvalId) ?? null;
}

export function getApprovalForProposal(
  proposalId: string,
): ApprovalBinding | null {
  for (const binding of approvals.values()) {
    if (binding.proposalId === proposalId) return binding;
  }
  return null;
}

export function listActionProposalsForMission(
  missionId: string,
): MapAbleActionProposal[] {
  return [...proposals.values()].filter((p) => p.missionId === missionId);
}

/** Test helper */
export function clearActionStore(): void {
  proposals.clear();
  approvals.clear();
}
