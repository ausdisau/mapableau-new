import { createHash, randomUUID } from "node:crypto";
import { isOptionsEngineEnabled, isOptionsModelExplanationEnabled } from "@/lib/config/options-engine";
import { applyHardConstraints } from "./constraints";
import { scrubEmployerFacingPayload } from "./domains/jobs";
import { evaluateEvidenceEligibility, findEligibility } from "./eligibility";
import { explainOption } from "./explain";
import { assertFairRanking, sanitizeCandidatesForFairness } from "./fairness";
import { algorithmRegisterRefForDomain, domainLimitations } from "./registry";
import { normalizeRankingPriorities, rankCandidates } from "./ranking";
import { optionsRequestSchema } from "./schemas";
import { getOptionsSession, saveOptionsSession, updateOptionsSession } from "./store";
import type { ChooseOptionInput, ChooseOptionResult, OptionsRequest, OptionsSession, RankedOption, RankingPriorities } from "./types";

function optionIdFor(candidateId: string, sessionId: string): string {
  return createHash("sha256").update(`${sessionId}:${candidateId}`).digest("hex").slice(0, 16);
}

export class OptionsEngineError extends Error {
  constructor(message: string) { super(message); this.name = "OptionsEngineError"; }
}

export function generateOptions(raw: OptionsRequest): OptionsSession {
  if (!isOptionsEngineEnabled()) throw new OptionsEngineError("OPTIONS_ENGINE_DISABLED");
  const input = optionsRequestSchema.parse(raw);
  const sessionId = input.sessionId ?? randomUUID();
  const traceId = input.traceId ?? randomUUID();
  const priorities = normalizeRankingPriorities(input.rankingPriorities);
  const tenantCandidates = input.candidates.filter((c) => c.tenantId === input.tenantId);
  const sanitized = sanitizeCandidatesForFairness(tenantCandidates);
  const fairness = assertFairRanking({ priorities, requirements: input.requirements, candidates: sanitized });
  const safeRequirements = input.requirements.filter((r) => !/diagnos|icd-?10|dsm-?5|medical.?condition/i.test(r.label + r.value));
  const { eligible, eliminated } = applyHardConstraints({
    domain: input.domain, candidates: sanitized, requirements: safeRequirements,
    exclusions: input.exclusions, disclosureConsentGranted: input.disclosureConsentGranted,
  });
  const eligibility = evaluateEvidenceEligibility(eligible, input.domain);
  const ranked = rankCandidates({ candidates: eligible, requirements: safeRequirements, priorities, eligibility });
  const modelExplanationUsed = input.requestModelExplanation === true && isOptionsModelExplanationEnabled();
  const options: RankedOption[] = ranked.map(({ candidate, score, dimensionScores }) => ({
    optionId: optionIdFor(candidate.id, sessionId), candidateId: candidate.id, domain: input.domain,
    displayName: candidate.displayName, providerLabel: candidate.providerLabel, score, dimensionScores,
    explanation: explainOption({ candidate, domain: input.domain, dimensionScores, eligibility: findEligibility(eligibility, candidate.id), requestModelExplanation: input.requestModelExplanation }),
    isAssignment: false, isConfirmation: false, isEmployerDisclosure: false,
  }));
  const limitations = [
    ...domainLimitations(input.domain),
    "Hard constraints are never relaxed by ranking or model commentary.",
    "Scores use transparent dimensions you can adjust — not an opaque 'best for you' claim.",
    "Choosing an option prepares a governed action proposal; it does not execute.",
    ...fairness.notes,
    ...(fairness.blockedHeuristics.length ? [`Blocked prohibited heuristics: ${fairness.blockedHeuristics.join(", ")}.`] : []),
  ];
  const session: OptionsSession = {
    sessionId, tenantId: input.tenantId, participantId: input.participantId, actorId: input.actorId, domain: input.domain,
    missionId: input.missionId ?? null, traceId, createdAt: new Date().toISOString(), requirements: safeRequirements,
    rankingPriorities: priorities, eliminated, eligibility, options, selectedOptionId: null, preparedProposalId: null,
    limitations, algorithmRegisterRef: algorithmRegisterRefForDomain(input.domain), modelExplanationUsed,
  };
  return saveOptionsSession(session);
}

export function reRankOptions(input: {
  sessionId: string; participantId: string; tenantId: string; rankingPriorities: Partial<RankingPriorities>;
  candidates: OptionsRequest["candidates"];
}): OptionsSession {
  if (!isOptionsEngineEnabled()) throw new OptionsEngineError("OPTIONS_ENGINE_DISABLED");
  const existing = getOptionsSession(input.sessionId);
  if (!existing) throw new OptionsEngineError("OPTIONS_SESSION_NOT_FOUND");
  assertSessionAccess(existing, input.participantId, input.tenantId);
  return generateOptions({
    sessionId: existing.sessionId, tenantId: existing.tenantId, participantId: existing.participantId, actorId: existing.actorId,
    domain: existing.domain, missionId: existing.missionId ?? undefined, traceId: existing.traceId,
    requirements: existing.requirements, rankingPriorities: input.rankingPriorities,
    candidates: input.candidates.filter((c) => c.tenantId === input.tenantId),
    requestModelExplanation: existing.modelExplanationUsed,
  });
}

export function chooseOption(input: ChooseOptionInput, deps?: {
  prepareProposal?: (ctx: { session: OptionsSession; option: RankedOption }) => string | null;
}): ChooseOptionResult {
  if (!isOptionsEngineEnabled()) throw new OptionsEngineError("OPTIONS_ENGINE_DISABLED");
  const session = getOptionsSession(input.sessionId);
  if (!session) throw new OptionsEngineError("OPTIONS_SESSION_NOT_FOUND");
  assertSessionAccess(session, input.participantId, input.tenantId);
  const selected = session.options.find((o) => o.optionId === input.optionId);
  if (!selected) throw new OptionsEngineError("OPTION_NOT_FOUND");
  if (session.domain === "jobs") {
    scrubEmployerFacingPayload({ optionId: selected.optionId, candidateId: selected.candidateId, disability: "MUST_NOT_FLOW", health: "MUST_NOT_FLOW" }, false);
  }
  let preparedProposalId: string | null = null;
  if (input.prepareActionProposal) {
    preparedProposalId = deps?.prepareProposal?.({ session, option: selected }) ?? `draft-proposal:${session.sessionId}:${selected.optionId}`;
  }
  const updated = updateOptionsSession(session.sessionId, { selectedOptionId: selected.optionId, preparedProposalId });
  if (!updated) throw new OptionsEngineError("OPTIONS_SESSION_UPDATE_FAILED");
  return { session: updated, selected, didAssign: false, didConfirmTransport: false, didDiscloseToEmployer: false, preparedProposalId, nextStep: selected.explanation.whatHappensNext };
}

export function getOptionsSnapshot(input: { sessionId: string; participantId: string; tenantId: string }): OptionsSession {
  const session = getOptionsSession(input.sessionId);
  if (!session) throw new OptionsEngineError("OPTIONS_SESSION_NOT_FOUND");
  assertSessionAccess(session, input.participantId, input.tenantId);
  return session;
}

function assertSessionAccess(session: OptionsSession, participantId: string, tenantId: string): void {
  if (session.participantId !== participantId || session.tenantId !== tenantId) throw new OptionsEngineError("OPTIONS_TENANT_ISOLATION_VIOLATION");
}

export function generateOptionsRulesOnly(raw: Omit<OptionsRequest, "requestModelExplanation">): OptionsSession {
  return generateOptions({ ...raw, requestModelExplanation: false });
}
