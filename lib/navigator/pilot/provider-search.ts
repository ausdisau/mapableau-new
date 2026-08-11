import { z } from "zod";

import { assertCapabilityInvocation } from "@/lib/ai/platform/capabilities/enforcement";
import {
  auditDecisionPassportProjected,
  projectDecisionPassport,
} from "@/lib/ai/platform/decision-passport/project";
import { assertDelegatedOrSelfAuthority } from "@/lib/authority/delegation-check";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { verifyPurposeConsent } from "@/lib/consent/purpose-consent";
import { assertNavigatorPilotEnabled } from "@/lib/config/navigator-pilot";
import { searchNdisProviders } from "@/lib/ingestion/ndis-providers-search";
import { createNavigatorEscalation } from "@/lib/navigator/pilot/escalation";
import {
  applyHardConstraints,
  type HardConstraintInput,
} from "@/lib/provider/finder/matching/hard-constraints";
import {
  DEFAULT_PARTICIPANT_WEIGHTS,
  rankEligibleProviders,
  type ParticipantRankingWeights,
} from "@/lib/provider/finder/matching/rank";
import { createGovernedActionEnvelope } from "@/intelligence/actions/governed-envelope";

export const navigatorProviderSearchTurnSchema = z.object({
  tenantId: z.string().min(1),
  participantId: z.string().min(1),
  actorUserId: z.string().min(1),
  requestedText: z.string().min(1).max(2000),
  q: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  service: z.string().optional(),
  accessNeedIds: z.array(z.string()).default([]),
  excludedProviderSourceIds: z.array(z.string()).default([]),
  conflictOfInterestProviderSourceIds: z.array(z.string()).default([]),
  preferredProviderSourceIds: z.array(z.string()).default([]),
  rankingWeights: z
    .object({
      continuity: z.number(),
      preferences: z.number(),
      relevantExperience: z.number(),
      accessibilityEvidence: z.number(),
      travelBurden: z.number(),
      availability: z.number(),
    })
    .partial()
    .optional(),
  aiOptOut: z.boolean().default(false),
  requestHumanReview: z.boolean().default(false),
  preferredContactMethod: z.string().default("in_app"),
});

export type NavigatorProviderSearchTurnInput = z.infer<
  typeof navigatorProviderSearchTurnSchema
>;

const CAPABILITY_KEY = "navigator.provider_search_pilot";

export async function runNavigatorProviderSearchTurn(
  raw: NavigatorProviderSearchTurnInput,
) {
  assertNavigatorPilotEnabled();
  const input = navigatorProviderSearchTurnSchema.parse(raw);

  const authority = await assertDelegatedOrSelfAuthority({
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    tenantId: input.tenantId,
    domain: "navigator",
    action: "provider_search",
    consentScopes: ["navigator.provider_search"],
  });
  if (!authority.ok) {
    throw new Error(authority.reason ?? "AUTHORITY_DENIED");
  }

  const consent = await verifyPurposeConsent({
    participantId: input.participantId,
    tenantId: input.tenantId,
    purpose: "navigator.provider_search",
    action: "provider_search",
    fields: ["preferences", "access_needs", "location"],
  });
  if (!consent.ok) {
    throw new Error(`CONSENT_${(consent.reason ?? "missing").toUpperCase()}`);
  }

  const invocation = assertCapabilityInvocation({
    capabilityKey: CAPABILITY_KEY,
    tenantId: input.tenantId,
    toolName: "search_ndis_providers",
    consentScopesPresent: ["navigator.provider_search"],
  });
  if (!invocation.allowed) {
    throw new Error(`CAPABILITY_DENIED:${invocation.reason}`);
  }

  if (input.aiOptOut) {
    const params = new URLSearchParams();
    if (input.q) params.set("q", input.q);
    if (input.state) params.set("state", input.state);
    if (input.postcode) params.set("postcode", input.postcode);
    if (input.service) params.set("service", input.service);
    if (input.accessNeedIds.length) {
      params.set("accessNeeds", input.accessNeedIds.join(","));
    }
    const nonAiPath = `/provider-finder?${params.toString()}`;
    await createAuditEvent({
      actorUserId: input.actorUserId,
      participantId: input.participantId,
      action: "navigator.turn.ai_opt_out",
      entityType: "NavigatorProviderSearch",
      metadata: { nonAiPath },
    });
    return {
      mode: "non_ai" as const,
      nonAiPath,
      passport: null,
      shortlist: [],
      noMatch: false,
      escalation: null,
      draftEnvelope: null,
      transferEnvelope: null,
    };
  }

  const search = await searchNdisProviders({
    q: input.q,
    state: input.state,
    postcode: input.postcode,
    service: input.service,
    limit: 50,
  });

  const hardInput: HardConstraintInput = {
    requiredAccessNeedIds: input.accessNeedIds,
    excludedProviderSourceIds: input.excludedProviderSourceIds,
    requiredState: input.state,
    requiredPostcode: input.postcode,
    requiredService: input.service,
    conflictOfInterestProviderSourceIds:
      input.conflictOfInterestProviderSourceIds,
  };
  const hard = applyHardConstraints(search.providers, hardInput);

  const weights: ParticipantRankingWeights = {
    ...DEFAULT_PARTICIPANT_WEIGHTS,
    ...(input.rankingWeights ?? {}),
  };
  const ranked = hard.noMatch
    ? []
    : rankEligibleProviders(hard.eligible, weights, {
        preferredProviderSourceIds: input.preferredProviderSourceIds,
        preferredServiceKeywords: input.service ? [input.service] : [],
        requiredAccessNeedIds: input.accessNeedIds,
        participantPostcode: input.postcode,
      });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "navigator.match.completed",
    entityType: "NavigatorProviderSearch",
    metadata: {
      candidateCount: search.count,
      eligibleCount: hard.eligible.length,
      noMatch: hard.noMatch,
      constraintsNotRelaxed: hard.constraintsNotRelaxed,
    },
  });

  let escalation = null;
  let draftEnvelope = null;
  let transferEnvelope = null;

  const shouldEscalate =
    input.requestHumanReview ||
    hard.noMatch ||
    authority.mode === "denied";

  if (shouldEscalate) {
    const reason = hard.noMatch
      ? "hard_constraints_no_safe_match"
      : input.requestHumanReview
        ? "participant_requested_person"
        : "identity_authority_or_consent_unclear";
    escalation = await createNavigatorEscalation({
      tenantId: input.tenantId,
      participantId: input.participantId,
      actorUserId: input.actorUserId,
      reason,
      urgency: hard.noMatch ? "medium" : "low",
      preferredContactMethod: input.preferredContactMethod,
      confidentialityRestrictions: [],
      requiredReviewerRole: "coordinator",
      summary: hard.noMatch
        ? `No safe provider match for: ${input.requestedText}`
        : `Participant requested human review for: ${input.requestedText}`,
      conflictOfInterestCheckPassed: true,
      responseDeadlineAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      evidenceRefs: [],
    });
  }

  if (!hard.noMatch && ranked.length > 0) {
    const top = ranked[0]!;
    draftEnvelope = await createGovernedActionEnvelope({
      tenantId: input.tenantId,
      participantId: input.participantId,
      initiatingUserId: input.actorUserId,
      capabilityKey: CAPABILITY_KEY,
      actionType: "create_care_request_draft",
      consentReceiptId: consent.receiptId!,
      requiredApproverRole: "participant",
      evidenceRefs: [top.provider.source_id],
      payload: {
        requestType: "personal_care",
        title: `Provider search draft: ${top.provider.provider_name}`,
        description: input.requestedText,
        state: input.state,
        suburb: top.provider.suburb ?? undefined,
        accessRequirementsSummary: input.accessNeedIds.join(", ") || undefined,
        shareAccessibility: false,
      },
    });

    transferEnvelope = await createGovernedActionEnvelope({
      tenantId: input.tenantId,
      participantId: input.participantId,
      initiatingUserId: input.actorUserId,
      capabilityKey: CAPABILITY_KEY,
      actionType: "transfer_provider_finder_filters",
      consentReceiptId: consent.receiptId!,
      requiredApproverRole: "participant",
      payload: {
        q: input.q,
        state: input.state,
        postcode: input.postcode,
        service: input.service,
        accessNeeds: input.accessNeedIds,
        providerFinderPath: "/provider-finder",
      },
    });
  }

  const passport = projectDecisionPassport({
    tenantId: input.tenantId,
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    capabilityKey: CAPABILITY_KEY,
    requestedSummary: input.requestedText,
    preferencesUsed: [
      ...(input.service ? [`service:${input.service}`] : []),
      ...input.accessNeedIds.map((id) => `access:${id}`),
    ],
    constraintsUsed: [
      ...input.excludedProviderSourceIds.map((id) => `exclude:${id}`),
      ...(input.state ? [`state:${input.state}`] : []),
      ...(input.postcode ? [`postcode:${input.postcode}`] : []),
      ...input.accessNeedIds.map((id) => `hard_access:${id}`),
    ],
    ranked,
    hardConstraints: hard,
    aiUsed: false,
    proposedActionType: hard.noMatch
      ? "open_human_escalation"
      : "create_care_request_draft",
    envelopeId: draftEnvelope?.id ?? escalation?.id ?? null,
    requiredApproverRole: "participant",
  });
  await auditDecisionPassportProjected({
    passport,
    actorUserId: input.actorUserId,
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "navigator.turn.completed",
    entityType: "NavigatorProviderSearch",
    metadata: {
      passportId: passport.id,
      shortlistCount: ranked.length,
      noMatch: hard.noMatch,
    },
  });

  return {
    mode: "governed" as const,
    nonAiPath: null,
    passport,
    shortlist: ranked.slice(0, 5),
    noMatch: hard.noMatch,
    escalation,
    draftEnvelope,
    transferEnvelope,
  };
}
