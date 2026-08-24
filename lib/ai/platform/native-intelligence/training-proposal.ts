import type {
  DatasetCard,
  ModelCard,
  TrainingProposal,
  TrainingProposalStatus,
} from "./types";

/**
 * Training proposal templates for disability-domain specialised models.
 *
 * Do NOT implement training merely because it is possible.
 * Require evidence that retrieval + prompting + rules are insufficient first.
 * Do NOT scrape disabled people's personal stories without lawful ethical basis.
 * No training data store is created here — proposals are in-memory structures only.
 */

export type CreateTrainingProposalInput = {
  id: string;
  governanceOwner: string;
  insufficiencyEvidence: string;
  datasetCard: DatasetCard;
  modelCard: ModelCard;
  evalPlan: string;
  privacyImpactSummary: string;
  computeEstimate: string;
  rollbackPlan: string;
  licensingNotes: string;
  requiresOwnerInfraDecision?: boolean;
  nowIso?: string;
};

const PROHIBITED_DATASET_MARKERS = [
  "scraped personal story",
  "unclear license",
  "participant production data",
  "without consent",
];

export function createTrainingProposal(
  input: CreateTrainingProposalInput
):
  | { ok: true; proposal: TrainingProposal }
  | { ok: false; reason: string; status: TrainingProposalStatus } {
  if (!input.insufficiencyEvidence.trim()) {
    return {
      ok: false,
      reason:
        "Training requires evidence that retrieval, prompting, and rules are insufficient.",
      status: "rejected",
    };
  }

  const blob = JSON.stringify(input.datasetCard).toLowerCase();
  for (const marker of PROHIBITED_DATASET_MARKERS) {
    if (blob.includes(marker)) {
      return {
        ok: false,
        reason: `Dataset card indicates prohibited source pattern: ${marker}`,
        status: "rejected",
      };
    }
  }

  if (!input.datasetCard.consentOrLicense.trim()) {
    return {
      ok: false,
      reason: "Consent or license basis is required.",
      status: "rejected",
    };
  }

  if (!input.datasetCard.deletionWithdrawalProcess.trim()) {
    return {
      ok: false,
      reason: "Deletion / withdrawal process is required.",
      status: "rejected",
    };
  }

  if (!input.governanceOwner.trim()) {
    return {
      ok: false,
      reason: "Governance owner is required.",
      status: "rejected",
    };
  }

  const requiresOwnerInfraDecision =
    input.requiresOwnerInfraDecision ??
    looksLikeSignificantInfraSpend(input.computeEstimate);

  if (requiresOwnerInfraDecision) {
    // Stop condition: document and await owner — do not auto-start training.
    return {
      ok: true,
      proposal: {
        id: input.id,
        status: "awaiting_governance",
        governanceOwner: input.governanceOwner,
        createdAt: input.nowIso ?? new Date().toISOString(),
        insufficiencyEvidence: input.insufficiencyEvidence,
        datasetCard: input.datasetCard,
        modelCard: {
          ...input.modelCard,
          evaluationStatus: "unevaluated",
        },
        evalPlan: input.evalPlan,
        privacyImpactSummary: input.privacyImpactSummary,
        computeEstimate: input.computeEstimate,
        rollbackPlan: input.rollbackPlan,
        licensingNotes: input.licensingNotes,
        requiresOwnerInfraDecision: true,
      },
    };
  }

  return {
    ok: true,
    proposal: {
      id: input.id,
      status: "draft",
      governanceOwner: input.governanceOwner,
      createdAt: input.nowIso ?? new Date().toISOString(),
      insufficiencyEvidence: input.insufficiencyEvidence,
      datasetCard: input.datasetCard,
      modelCard: {
        ...input.modelCard,
        evaluationStatus: "unevaluated",
      },
      evalPlan: input.evalPlan,
      privacyImpactSummary: input.privacyImpactSummary,
      computeEstimate: input.computeEstimate,
      rollbackPlan: input.rollbackPlan,
      licensingNotes: input.licensingNotes,
      requiresOwnerInfraDecision: false,
    },
  };
}

export function trainingProposalTemplate(): CreateTrainingProposalInput {
  return {
    id: "tp-template",
    governanceOwner: "ai-platform-governance",
    insufficiencyEvidence:
      "Describe why retrieval + prompting + deterministic rules are insufficient for this task.",
    datasetCard: {
      name: "",
      purpose: "",
      provenance: "",
      consentOrLicense: "",
      deIdentification: "",
      representativenessNotes: "",
      biasRisks: [
        "disability stereotype amplification",
        "under-representation of intersectional cohorts",
        "accessibility-language erasure",
      ],
      deletionWithdrawalProcess: "",
      evalSplitDescription: "",
      prohibitedSources: [
        "scraped personal stories without lawful ethical basis",
        "unclear-license corpora",
        "participant production data without governance",
      ],
    },
    modelCard: {
      name: "",
      baseModel: "",
      intendedTasks: [],
      outOfScope: [
        "permission decisions",
        "action execution",
        "safeguarding adjudication",
        "clinical decisions",
      ],
      evaluationStatus: "unevaluated",
    },
    evalPlan:
      "Reuse Prompt 10 eval lab dimensions: accessibility language, disability bias, instruction following, hallucination, provenance, structured output, privacy, latency, cost, mission-quality impact. Benchmark alone cannot promote.",
    privacyImpactSummary: "",
    computeEstimate: "",
    rollbackPlan: "Revert to gateway + deterministic + retrieval; no auto-promote.",
    licensingNotes: "",
    requiresOwnerInfraDecision: false,
  };
}

function looksLikeSignificantInfraSpend(estimate: string): boolean {
  const lower = estimate.toLowerCase();
  return (
    lower.includes("gpu cluster") ||
    lower.includes("multi-node") ||
    lower.includes("significant") ||
    /\$\s*\d{4,}/.test(estimate)
  );
}
