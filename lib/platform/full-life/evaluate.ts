import type {
  FullLifeAssuranceDimension,
  FullLifeFindingState,
  FullLifeHarnessFinding,
  FullLifeHarnessInput,
  FullLifeHarnessResult,
  FullLifeHarnessDecision,
  FullLifeOptionTradeoff,
  FullLifeResourceState,
  FullLifeRuleId,
} from "./contracts";

const FINDING_STATE_PRECEDENCE: Record<FullLifeFindingState, number> = {
  NOT_APPLICABLE: 0,
  PASS: 1,
  CAUTION: 2,
  UNKNOWN: 3,
  FAIL: 4,
};

interface FindingArgs {
  ruleId: FullLifeRuleId;
  dimension: FullLifeAssuranceDimension;
  state: FullLifeFindingState;
  title: string;
  reason: string;
  affectedProposalIds?: string[];
  evidenceRefs?: string[];
  hardFail?: boolean;
  remediation?: string | null;
  humanReviewReason?: string | null;
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function resourceIsUsable(state: FullLifeResourceState): boolean {
  return (
    state === "VERIFIED_AVAILABLE" ||
    state === "PARTICIPANT_OFFERED" ||
    state === "AVAILABLE_WITH_CONDITIONS"
  );
}

function optionTradeoffs(input: FullLifeHarnessInput): FullLifeOptionTradeoff[] {
  const hardConstraintIds = new Set(
    input.participantPriorities
      .filter((priority) => priority.kind === "HARD_CONSTRAINT")
      .map((priority) => priority.id),
  );

  return input.candidateOptions.map((option) => {
    const resourceUnknowns = option.requiredResourceTypes.flatMap((type) => {
      const matching = input.resourceEnvelope.items.filter((item) => item.type === type);
      if (matching.some((item) => resourceIsUsable(item.state))) return [];
      return [`Resource status unresolved: ${type}`];
    });

    return {
      optionRef: option.optionRef,
      benefits: option.satisfiesPriorityIds.map(
        (priorityId) => `Satisfies participant priority: ${priorityId}`,
      ),
      drawbacks: option.conflictsWithPriorityIds.map(
        (priorityId) => `Conflicts with participant priority: ${priorityId}`,
      ),
      unknowns: resourceUnknowns,
      conflictsWithPriorityIds: [...option.conflictsWithPriorityIds],
      satisfiesHardConstraintIds: option.satisfiesPriorityIds.filter((id) =>
        hardConstraintIds.has(id),
      ),
      commercialInfluenceRefs: [...option.commercialInfluenceRefs],
    };
  });
}

export function evaluateFullLifeHarness(
  input: FullLifeHarnessInput,
): FullLifeHarnessResult {
  const findings: FullLifeHarnessFinding[] = [];
  const blocked = new Set<string>();
  const unresolvedQuestions = new Set<string>();
  const humanReviewReasons = new Set<string>();
  let participantDecisionRequired = false;
  let reviewRequired = false;
  let degradeToManual = false;
  let globalBlock = false;
  let stopAndEscalate = false;

  const addFinding = (args: FindingArgs) => {
    const index = findings.filter((finding) => finding.ruleId === args.ruleId).length + 1;
    findings.push({
      id: `${args.ruleId}-${String(index).padStart(2, "0")}`,
      ruleId: args.ruleId,
      dimension: args.dimension,
      state: args.state,
      title: args.title,
      reason: args.reason,
      evidenceRefs: unique(args.evidenceRefs ?? []),
      affectedMissionNodeIds: [],
      affectedProposalIds: unique(args.affectedProposalIds ?? []),
      hardFail: args.hardFail ?? false,
      remediation: args.remediation ?? null,
      humanReviewReason: args.humanReviewReason ?? null,
    });
  };

  const blockAll = () => {
    input.proposalIds.forEach((proposalId) => blocked.add(proposalId));
    globalBlock = true;
  };

  // Agency and reversibility: participant rejection is authoritative for that proposal only.
  if (input.assurance.agency.participantRejectedProposalIds.length > 0) {
    const rejected = input.assurance.agency.participantRejectedProposalIds.filter((id) =>
      input.proposalIds.includes(id),
    );
    rejected.forEach((proposalId) => blocked.add(proposalId));
    addFinding({
      ruleId: "FL-002",
      dimension: "agency",
      state: "PASS",
      title: "Participant rejection preserved",
      reason: "Participant-rejected proposals are excluded without cancelling unrelated options.",
      affectedProposalIds: rejected,
    });
    addFinding({
      ruleId: "FL-012",
      dimension: "reversibility_remedy",
      state: "PASS",
      title: "Decision remains reversible",
      reason: "A changed decision removes the rejected proposal while preserving the wider life goal.",
      affectedProposalIds: rejected,
    });
  }

  if (input.assurance.agency.supporterInputAwaitingParticipantConfirmation) {
    reviewRequired = true;
    participantDecisionRequired = true;
    addFinding({
      ruleId: "FL-002",
      dimension: "agency",
      state: "CAUTION",
      title: "Participant confirmation required",
      reason: "Supporter input remains provisional until the participant confirms, rejects, or revises it.",
      humanReviewReason: "Supporter input must not substitute for participant authorship.",
    });
  }

  // Authority is deterministic and fail-closed.
  if (["MISSING", "OUT_OF_SCOPE", "REVOKED"].includes(input.assurance.authority.state)) {
    blockAll();
    addFinding({
      ruleId: "FL-002",
      dimension: "authority",
      state: "FAIL",
      title: "Authority is not valid for execution",
      reason: `Actor authority state is ${input.assurance.authority.state}; MapAble execution is blocked until valid authority exists.`,
      affectedProposalIds: input.proposalIds,
      evidenceRefs: input.assurance.authority.evidenceRefs,
      hardFail: true,
      remediation: "Restore or confirm valid scoped authority before execution.",
    });
  } else if (input.assurance.authority.state === "REVIEW_REQUIRED") {
    reviewRequired = true;
    humanReviewReasons.add("Authority scope requires human review.");
    addFinding({
      ruleId: "FL-002",
      dimension: "authority",
      state: "UNKNOWN",
      title: "Authority requires review",
      reason: "The current authority snapshot does not establish sufficient scope for deterministic execution.",
      evidenceRefs: input.assurance.authority.evidenceRefs,
      humanReviewReason: "Confirm actor authority scope.",
    });
  }

  // Accessibility is a precondition for equivalent decision-making authority.
  if (input.assurance.accessibility.inaccessibleSoleChannel) {
    addFinding({
      ruleId: "FL-003",
      dimension: "accessibility",
      state: "FAIL",
      title: "Sole interaction channel is inaccessible",
      reason: "The participant cannot be required to use an inaccessible sole channel to exercise decision-making authority.",
      evidenceRefs: input.assurance.accessibility.evidenceRefs,
      hardFail: !(
        input.assurance.resilience.nonAiPathAvailable ||
        input.assurance.resilience.humanHelpAvailable
      ),
    });
    if (
      input.assurance.resilience.nonAiPathAvailable ||
      input.assurance.resilience.humanHelpAvailable
    ) {
      degradeToManual = true;
    } else {
      blockAll();
    }
  }

  const unmetHardConstraints = new Set(input.assurance.accessibility.unmetHardConstraintIds);
  if (unmetHardConstraints.size > 0) {
    const affected = new Set<string>();
    for (const option of input.candidateOptions) {
      const conflicts = option.conflictsWithPriorityIds.some((id) => unmetHardConstraints.has(id));
      const missesRequiredConstraint = [...unmetHardConstraints].some(
        (id) => !option.satisfiesPriorityIds.includes(id),
      );
      if (conflicts || missesRequiredConstraint) {
        option.proposalIds.forEach((proposalId) => {
          blocked.add(proposalId);
          affected.add(proposalId);
        });
      }
    }
    addFinding({
      ruleId: "FL-003",
      dimension: "accessibility",
      state: "FAIL",
      title: "Participant access constraint is unmet",
      reason: "Options that do not satisfy a participant-confirmed hard access constraint cannot proceed.",
      affectedProposalIds: [...affected],
      evidenceRefs: input.assurance.accessibility.evidenceRefs,
      hardFail: true,
    });
  }

  // Privacy and disclosure control.
  const proposedDisclosure = input.assurance.disclosure.proposedFields;
  const consentState = input.assurance.consent.state;
  const approvedFields = new Set(input.assurance.disclosure.approvedFields);
  const disclosureExceedsConsent = proposedDisclosure.some((field) => !approvedFields.has(field));
  const consentUnavailable = ["MISSING", "REVOKED", "EXPIRED"].includes(consentState);

  if (proposedDisclosure.length > 0 && (consentUnavailable || disclosureExceedsConsent)) {
    blockAll();
    addFinding({
      ruleId: "FL-007",
      dimension: "privacy",
      state: "FAIL",
      title: "Disclosure is not authorised",
      reason: "Proposed disclosure exceeds the current purpose-bound consent snapshot; MapAble execution is blocked.",
      affectedProposalIds: input.proposalIds,
      evidenceRefs: input.assurance.consent.evidenceRefs,
      hardFail: true,
      remediation: "Obtain current, purpose-specific participant consent for the minimum necessary fields.",
    });
  } else if (!input.assurance.disclosure.minimumNecessary) {
    reviewRequired = true;
    addFinding({
      ruleId: "FL-007",
      dimension: "privacy",
      state: "CAUTION",
      title: "Disclosure may exceed minimum necessary information",
      reason: "The proposed disclosure requires review for purpose limitation and data minimisation.",
      humanReviewReason: "Review minimum-necessary disclosure scope.",
    });
  }

  // Evidence integrity: unknown, stale, and conflicting evidence remains explicit.
  if (input.assurance.evidence.verificationInflationRefs.length > 0) {
    blockAll();
    addFinding({
      ruleId: "FL-008",
      dimension: "evidence_integrity",
      state: "FAIL",
      title: "Evidence verification state was inflated",
      reason: "Unverified evidence must not be represented as verified when determining whether MapAble may execute.",
      affectedProposalIds: input.proposalIds,
      evidenceRefs: input.assurance.evidence.verificationInflationRefs,
      hardFail: true,
    });
  }

  const uncertainEvidence = unique([
    ...input.assurance.evidence.staleRefs,
    ...input.assurance.evidence.conflictingRefs,
    ...input.assurance.evidence.unknownRefs,
  ]);
  if (uncertainEvidence.length > 0) {
    reviewRequired = true;
    unresolvedQuestions.add("Resolve material stale, conflicting, or unknown evidence before execution.");
    addFinding({
      ruleId: "FL-008",
      dimension: "evidence_integrity",
      state: "UNKNOWN",
      title: "Material evidence remains unresolved",
      reason: "Stale, conflicting, or unknown evidence remains unresolved and is not converted into a negative finding about the participant.",
      evidenceRefs: uncertainEvidence,
    });
  }

  // Equality: flag discriminatory reasoning without cancelling the person's wider goal.
  if (
    input.assurance.equality.diagnosisOnlyExclusion ||
    input.assurance.equality.accessBarrierMisclassifiedAsParticipantUnsuitability
  ) {
    reviewRequired = true;
    humanReviewReasons.add("Potential discriminatory exclusion requires review.");
    addFinding({
      ruleId: "FL-006",
      dimension: "agency",
      state: "FAIL",
      title: "Potential discriminatory exclusion detected",
      reason: "A diagnosis-only exclusion or access barrier must not be reframed as participant unsuitability.",
      humanReviewReason: "Review for equality, reasonable adjustment, and non-discrimination.",
    });
  }

  // Resource and financial integrity.
  if (input.assurance.financial.fundingAuthority === "UNKNOWN") {
    reviewRequired = true;
    unresolvedQuestions.add("Confirm funding authority before any funded execution.");
    addFinding({
      ruleId: "FL-010",
      dimension: "resources",
      state: "UNKNOWN",
      title: "Funding authority is unknown",
      reason: "The funding authority snapshot is unresolved; the harness does not infer eligibility or ineligibility.",
    });
  } else if (input.assurance.financial.fundingAuthority === "NOT_AUTHORISED") {
    blockAll();
    addFinding({
      ruleId: "FL-010",
      dimension: "financial_integrity",
      state: "FAIL",
      title: "Funding is not authorised for execution",
      reason: "The current financial authority snapshot does not authorise MapAble to execute a funded action.",
      affectedProposalIds: input.proposalIds,
      hardFail: true,
    });
  }

  if (input.assurance.financial.duplicateTransactionRefs.length > 0) {
    blockAll();
    addFinding({
      ruleId: "FL-010",
      dimension: "financial_integrity",
      state: "FAIL",
      title: "Duplicate transaction risk detected",
      reason: "A possible duplicate transaction must be resolved before MapAble can execute a financial action.",
      affectedProposalIds: input.proposalIds,
      evidenceRefs: input.assurance.financial.duplicateTransactionRefs,
      hardFail: true,
    });
  }

  if (input.assurance.financial.priceMismatchRefs.length > 0) {
    reviewRequired = true;
    addFinding({
      ruleId: "FL-010",
      dimension: "financial_integrity",
      state: "CAUTION",
      title: "Price evidence requires reconciliation",
      reason: "A price mismatch must be explained before an option is presented as financially settled.",
      evidenceRefs: input.assurance.financial.priceMismatchRefs,
    });
  }

  const assumedTypes = new Set(input.resourceEnvelope.assumedAvailableTypes);
  if (assumedTypes.size > 0) {
    for (const option of input.candidateOptions) {
      const invalidAssumption = option.requiredResourceTypes.some((type) => {
        if (!assumedTypes.has(type)) return false;
        const matches = input.resourceEnvelope.items.filter((item) => item.type === type);
        return !matches.some((item) => resourceIsUsable(item.state));
      });
      if (invalidAssumption) {
        option.proposalIds.forEach((proposalId) => blocked.add(proposalId));
      }
    }

    if (assumedTypes.has("informal_support")) {
      addFinding({
        ruleId: "FL-010",
        dimension: "resources",
        state: "FAIL",
        title: "Informal support was assumed",
        reason: "Informal support must be participant-offered or otherwise explicitly evidenced; it is never presumed free or available.",
        affectedProposalIds: [...blocked],
        hardFail: true,
      });
    }
  }

  // Safeguarding preserves dignity of risk while escalating genuine emergencies.
  if (input.assurance.safeguarding.state === "EMERGENCY_ESCALATION") {
    blockAll();
    stopAndEscalate = true;
    humanReviewReasons.add("Emergency safeguarding escalation is active.");
    addFinding({
      ruleId: "FL-009",
      dimension: "safeguarding",
      state: "FAIL",
      title: "Emergency safeguarding escalation required",
      reason: "The current snapshot requires immediate human escalation; the harness does not autonomously resolve the emergency.",
      affectedProposalIds: input.proposalIds,
      evidenceRefs: input.assurance.safeguarding.evidenceRefs,
      hardFail: true,
      humanReviewReason: "Immediate human safeguarding response required.",
    });
  } else if (
    input.assurance.safeguarding.state === "HUMAN_REVIEW_REQUIRED" ||
    input.assurance.safeguarding.state === "MATERIAL_RISK"
  ) {
    reviewRequired = true;
    humanReviewReasons.add("Material safeguarding concern requires proportional human review.");
    addFinding({
      ruleId: "FL-009",
      dimension: "safeguarding",
      state: "CAUTION",
      title: "Safeguarding review required",
      reason: "A material safeguarding concern requires proportionate human review without substituting risk avoidance for participant choice.",
      evidenceRefs: input.assurance.safeguarding.evidenceRefs,
      humanReviewReason: "Review proportionate safeguards and participant preferences.",
    });
  }

  if (input.assurance.safeguarding.restrictiveDefaultProposed) {
    reviewRequired = true;
    addFinding({
      ruleId: "FL-009",
      dimension: "safeguarding",
      state: "CAUTION",
      title: "Restrictive default requires review",
      reason: "A restrictive default may be paternalistic and requires explicit proportionality review.",
      humanReviewReason: "Check for less restrictive, participant-preferred alternatives.",
    });
  }

  // Continuity and remedy are handled as recoverable mission conditions where possible.
  if (input.assurance.continuity.crossDomainDependencyBroken) {
    addFinding({
      ruleId: "FL-012",
      dimension: "continuity",
      state: "CAUTION",
      title: "Cross-domain dependency is broken",
      reason: "A component failure requires recovery or replanning; it does not invalidate the participant's life goal.",
      evidenceRefs: input.assurance.continuity.criticalAlertIds,
    });

    if (input.assurance.continuity.recoveryOptions.length > 0) {
      reviewRequired = true;
      participantDecisionRequired = true;
    } else if (
      input.assurance.resilience.nonAiPathAvailable ||
      input.assurance.resilience.humanHelpAvailable
    ) {
      degradeToManual = true;
    } else {
      blockAll();
    }
  }

  if (
    !input.assurance.resilience.nonAiPathAvailable &&
    !input.assurance.resilience.humanHelpAvailable
  ) {
    blockAll();
    addFinding({
      ruleId: "FL-012",
      dimension: "resilience",
      state: "FAIL",
      title: "No usable fallback is available",
      reason: "MapAble must not make continued AI availability a precondition for participant agency or access to human support.",
      affectedProposalIds: input.proposalIds,
      hardFail: true,
      remediation: "Restore a non-AI or human-help path before execution.",
    });
  }

  // Commercial signals are disclosed, never used to improve apparent fit.
  const undisclosedConflicts = input.commercialInfluence.filter((influence) => {
    const hasConflict =
      influence.mapAbleOwnedService ||
      influence.sponsored ||
      influence.referralFeeExpected ||
      influence.commissionExpected ||
      Boolean(influence.otherConflict);
    return hasConflict && influence.disclosureText.trim().length === 0;
  });

  if (undisclosedConflicts.length > 0) {
    reviewRequired = true;
    humanReviewReasons.add("Undisclosed commercial influence requires review.");
    addFinding({
      ruleId: "FL-011",
      dimension: "commercial_integrity",
      state: "FAIL",
      title: "Commercial influence is not disclosed",
      reason: "Commercial ownership, sponsorship, referral fees, commissions, or other conflicts must be visible and must not alter fit or safety evidence.",
      humanReviewReason: "Disclose commercial influence before presenting the affected option as neutral.",
    });
  }

  // AURA remains an opaque operational-risk reference; this harness does not recalculate its risk model.
  if (input.aura?.outcome === "DENIED") {
    blockAll();
    humanReviewReasons.add("AURA operational-risk outcome denied execution.");
    addFinding({
      ruleId: "FL-012",
      dimension: "safeguarding",
      state: "FAIL",
      title: "Referenced AURA outcome denies execution",
      reason: "The Full Life harness honours the referenced AURA operational-risk outcome without duplicating or recalculating AURA logic.",
      affectedProposalIds: input.proposalIds,
      hardFail: true,
    });
  } else if (input.aura?.outcome === "HITL_PENDING" || input.aura?.requiresHITL) {
    reviewRequired = true;
    humanReviewReasons.add("AURA requires human-in-the-loop review.");
  }

  const permittedProposalIds = input.proposalIds.filter((proposalId) => !blocked.has(proposalId));
  const blockedProposalIds = input.proposalIds.filter((proposalId) => blocked.has(proposalId));

  let decision: FullLifeHarnessDecision;
  if (stopAndEscalate) {
    decision = "STOP_AND_ESCALATE";
  } else if (globalBlock || (input.proposalIds.length > 0 && permittedProposalIds.length === 0)) {
    decision = "BLOCK_EXECUTION";
  } else if (degradeToManual) {
    decision = "DEGRADE_TO_MANUAL";
  } else if (reviewRequired) {
    decision = "REVIEW_REQUIRED";
  } else if (permittedProposalIds.length > 0 || input.candidateOptions.length > 0) {
    decision = "PROPOSE";
  } else {
    decision = "PRESENT";
  }

  if (decision === "PROPOSE" || decision === "REVIEW_REQUIRED" || decision === "DEGRADE_TO_MANUAL") {
    participantDecisionRequired = participantDecisionRequired || permittedProposalIds.length > 0;
  }

  const byDimension: FullLifeHarnessResult["byDimension"] = {};
  for (const finding of findings) {
    const current = byDimension[finding.dimension];
    if (!current || FINDING_STATE_PRECEDENCE[finding.state] > FINDING_STATE_PRECEDENCE[current]) {
      byDimension[finding.dimension] = finding.state;
    }
  }

  return {
    harnessVersion: input.harnessVersion,
    missionId: input.missionId,
    missionPlanHash: input.missionPlanHash,
    evaluatedAt: input.evaluatedAt,
    decision,
    findings,
    optionTradeoffs: optionTradeoffs(input),
    participantDecisionRequired,
    humanReviewRequired: humanReviewReasons.size > 0 || stopAndEscalate,
    permittedProposalIds,
    blockedProposalIds,
    unresolvedQuestions: [...unresolvedQuestions].sort(),
    evidenceRefs: [...input.evidenceRefs],
    byDimension,
  };
}
