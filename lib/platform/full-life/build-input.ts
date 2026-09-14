import { createHash } from "node:crypto";

import type { MapAbleMissionPlan } from "@/lib/ai/platform/missions/types";

import {
  FULL_LIFE_HARNESS_VERSION,
  type FullLifeAssuranceSnapshot,
  type FullLifeAuraReference,
  type FullLifeCandidateOption,
  type FullLifeCommercialInfluence,
  type FullLifeHarnessInput,
  type FullLifeParticipantPriority,
  type FullLifeResourceEnvelope,
} from "./contracts";

export interface BuildFullLifeHarnessInputArgs {
  mission: MapAbleMissionPlan;
  actorId: string;
  participantId: string;
  lifeIntentId?: string | null;
  participantPriorities: FullLifeParticipantPriority[];
  assurance: FullLifeAssuranceSnapshot;
  resourceEnvelope: FullLifeResourceEnvelope;
  commercialInfluence: FullLifeCommercialInfluence[];
  candidateOptions: FullLifeCandidateOption[];
  aura?: FullLifeAuraReference | null;
  evaluatedAt: string;
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortObject(child)]),
  );
}

function missionHashProjection(mission: MapAbleMissionPlan) {
  return {
    missionId: mission.missionId,
    objective: mission.objective,
    status: mission.status,
    domains: [...mission.domains].sort(),
    missionGraph: mission.missionGraph,
    evidenceSummary: mission.evidenceSummary,
    continuityAlerts: mission.continuityAlerts,
    actionProposals: mission.actionProposals,
    approvalRequirements: mission.approvalRequirements,
    authorityCeiling: mission.authorityCeiling,
    planVersion: mission.planVersion ?? null,
    updatedAt: mission.updatedAt,
  };
}

export function hashFullLifeMissionPlan(mission: MapAbleMissionPlan): string {
  const stableJson = JSON.stringify(sortObject(missionHashProjection(mission)));
  return createHash("sha256").update(stableJson).digest("hex");
}

function collectEvidenceRefs(args: BuildFullLifeHarnessInputArgs): string[] {
  const { assurance, resourceEnvelope, candidateOptions } = args;
  const refs = new Set<string>();
  const add = (values: string[]) => values.forEach((value) => refs.add(value));

  add(assurance.authority.evidenceRefs);
  add(assurance.consent.evidenceRefs);
  add(assurance.accessibility.evidenceRefs);
  add(assurance.safeguarding.evidenceRefs);
  add(assurance.evidence.unknownRefs);
  add(assurance.evidence.staleRefs);
  add(assurance.evidence.conflictingRefs);
  add(assurance.evidence.inferredRefs);
  add(assurance.evidence.verificationInflationRefs);

  resourceEnvelope.items.forEach((item) => add(item.evidenceRefs));
  candidateOptions.forEach((option) => add(option.evidenceRefs));

  return [...refs].sort();
}

export function buildFullLifeHarnessInput(
  args: BuildFullLifeHarnessInputArgs,
): FullLifeHarnessInput {
  const {
    mission,
    actorId,
    participantId,
    lifeIntentId = null,
    participantPriorities,
    assurance,
    resourceEnvelope,
    commercialInfluence,
    candidateOptions,
    aura = null,
    evaluatedAt,
  } = args;

  return {
    harnessVersion: FULL_LIFE_HARNESS_VERSION,
    missionId: mission.missionId,
    participantId,
    actorId,
    lifeIntentId,
    missionPlanVersion: mission.planVersion ?? null,
    missionPlanHash: hashFullLifeMissionPlan(mission),
    proposalIds: mission.actionProposals.map((proposal) => proposal.id),
    participantPriorities,
    authorityEvidenceRefs: [...new Set(assurance.authority.evidenceRefs)].sort(),
    consentEvidenceRefs: [...new Set(assurance.consent.evidenceRefs)].sort(),
    evidenceRefs: collectEvidenceRefs(args),
    resourceEnvelope,
    commercialInfluence,
    assurance,
    candidateOptions,
    aura,
    evaluatedAt,
  };
}
