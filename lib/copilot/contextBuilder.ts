import type { CopilotContext } from "@/lib/copilot/types";
import { buildParticipantNeedsSnapshot } from "@/lib/participant-needs/build-needs-snapshot";
import {
  isMockParticipant,
  MOCK_CONSENT,
  MOCK_MISSING_EVIDENCE,
  MOCK_OPEN_RISKS,
  MOCK_PLAN,
  MOCK_UPCOMING_EVENTS,
} from "@/lib/prms/mockPrmsData";

/**
 * Builds a privacy-scoped context object for Co-Pilot.
 * Does not expose raw NDIS numbers, free-text case notes, or incident narratives
 * unless the active workflow is incident/safety (handled at route level).
 */
export async function buildCopilotContext(
  participantId: string,
): Promise<CopilotContext | null> {
  const snapshot = await buildParticipantNeedsSnapshot(participantId);

  if (snapshot) {
    const accessNeeds = snapshot.signals
      .filter((s) =>
        ["mobility", "communication", "daily_living", "risks"].includes(s.domain),
      )
      .slice(0, 12)
      .map((s) => ({ id: s.id, label: s.label }));

    const mobilityAids = snapshot.signals
      .filter((s) => s.domain === "mobility")
      .map((s) => ({ id: s.id, label: s.label }));

    const communicationPreferences = snapshot.signals
      .filter((s) => s.domain === "communication")
      .map((s) => ({ id: s.id, mode: s.label }));

    const activeGoals = snapshot.signals
      .filter((s) => s.domain === "plan_goals")
      .map((s) => ({ id: s.id, summary: s.label }));

    const planSummary = isMockParticipant(participantId)
      ? {
          status: MOCK_PLAN.status,
          fundingManagement: MOCK_PLAN.fundingManagement,
          overallBudgetBand: MOCK_PLAN.overallBudgetBand,
        }
      : {
          status: "unknown",
          fundingManagement: "unknown",
          overallBudgetBand: "healthy",
        };

    const consentSummary = isMockParticipant(participantId)
      ? {
          grantedScopes: MOCK_CONSENT.records
            .filter((r) => r.status === "granted")
            .map((r) => r.scope),
          openConsentConflicts: MOCK_CONSENT.openConflicts,
        }
      : {
          grantedScopes: [],
          openConsentConflicts: [],
        };

    return {
      participantId,
      profileCompletionPercent: snapshot.profileCompletionPercent,
      accessNeeds,
      mobilityAids,
      communicationPreferences,
      planSummary,
      activeGoals,
      consentSummary,
      upcomingEvents: isMockParticipant(participantId)
        ? MOCK_UPCOMING_EVENTS.map((e) => ({
            id: e.id,
            title: e.title,
            scheduledAt: e.scheduledAt,
          }))
        : [],
      openRisks: isMockParticipant(participantId)
        ? MOCK_OPEN_RISKS.map((r) => ({
            id: r.id,
            level: r.level,
            label: r.label,
          }))
        : snapshot.signals
            .filter((s) => s.domain === "risks")
            .map((s) => ({
              id: s.id,
              level: "watch",
              label: s.label,
            })),
      missingEvidence: isMockParticipant(participantId)
        ? [...MOCK_MISSING_EVIDENCE]
        : [],
      needsGaps: snapshot.gaps.map((g) => g.reason),
    };
  }

  return null;
}
