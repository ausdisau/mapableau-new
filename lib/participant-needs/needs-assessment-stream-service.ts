import { buildParticipantNeedsSnapshot } from "@/lib/participant-needs/build-needs-snapshot";
import { needsSnapshotToWorkerFilters } from "@/lib/participant-needs/needs-to-worker-filters";
import type {
  NeedsAssessmentRecommendation,
  NeedsAssessmentResult,
  NeedsAssessmentStreamEvent,
  ParticipantNeedsSnapshot,
} from "@/lib/participant-needs/types";
import type { DraftPrmsRecord } from "@/lib/prms/types";

type StreamParams = {
  participantId: string;
  query?: string;
  onEvent?: (event: NeedsAssessmentStreamEvent) => void | Promise<void>;
};

export async function runNeedsAssessmentStream({
  participantId,
  query,
  onEvent,
}: StreamParams): Promise<NeedsAssessmentResult> {
  const normalizedQuery = query?.trim() ?? "";

  await emit(onEvent, {
    stage: "received_query",
    message: "Starting your needs assessment.",
    payload: { query: normalizedQuery },
  });

  await emit(onEvent, {
    stage: "loaded_profile",
    message: "Loading your participant profile and accessibility information.",
  });

  const snapshot = await buildParticipantNeedsSnapshot(
    participantId,
    normalizedQuery,
  );

  if (!snapshot) {
    throw new Error(
      "Participant profile not found. Complete your profile or use the demo participant.",
    );
  }

  await emit(onEvent, {
    stage: "analysed_domains",
    message: `Reviewed ${snapshot.signals.length} needs signals across your record.`,
    payload: {
      signalCount: snapshot.signals.length,
      completionPercent: snapshot.profileCompletionPercent,
    },
  });

  await emit(onEvent, {
    stage: "identified_gaps",
    message:
      snapshot.gaps.length > 0
        ? `Found ${snapshot.gaps.length} areas that may need more detail.`
        : "Your core need domains look well documented.",
    payload: { gapCount: snapshot.gaps.length },
  });

  const recommendations = buildRecommendations(snapshot, normalizedQuery);
  const draftRecords = buildAssessmentDrafts(participantId, snapshot, normalizedQuery);
  const summary = buildPlainLanguageSummary(snapshot, normalizedQuery);

  await emit(onEvent, {
    stage: "recommendations",
    message: `Prepared ${recommendations.length} recommended next steps.`,
    payload: { recommendationCount: recommendations.length },
  });

  await emit(onEvent, {
    stage: "finalized",
    message: "Needs assessment complete.",
  });

  return {
    participantId,
    summary,
    snapshot,
    recommendations,
    suggestedActions: recommendations.map((r) => r.label),
    draftRecords,
    workerSearchQuery: buildWorkerSearchQuery(snapshot, normalizedQuery),
  };
}

function buildPlainLanguageSummary(
  snapshot: ParticipantNeedsSnapshot,
  query: string,
): string {
  const domainCount = new Set(snapshot.signals.map((s) => s.domain)).size;
  const gapText =
    snapshot.gaps.length === 0
      ? "We did not find major gaps in your core need domains."
      : `We found ${snapshot.gaps.length} area(s) that could use more detail before matching support.`;

  const queryLead = query
    ? `Based on your question about “${query.slice(0, 80)}${query.length > 80 ? "…" : ""}”, `
    : "";

  return `${queryLead}your record shows ${snapshot.signals.length} documented need signal(s) across ${domainCount} domain(s). Your profile is about ${snapshot.profileCompletionPercent}% complete for matching. ${gapText} Nothing is saved to your official record until you confirm a draft.`;
}

function buildRecommendations(
  snapshot: ParticipantNeedsSnapshot,
  query: string,
): NeedsAssessmentRecommendation[] {
  const items: NeedsAssessmentRecommendation[] = [];

  if (snapshot.profileCompletionPercent < 80) {
    items.push({
      id: "rec-profile",
      label: "Update accessibility profile",
      kind: "update_accessibility",
      href: "/dashboard/profile/edit",
    });
  }

  if (snapshot.gaps.some((g) => g.domain === "daily_living")) {
    items.push({
      id: "rec-care",
      label: "Draft a care request from your needs",
      kind: "draft_care_request",
      href: "/dashboard",
    });
  }

  if (
    snapshot.gaps.some((g) => g.domain === "transport") ||
    query.toLowerCase().includes("transport")
  ) {
    items.push({
      id: "rec-consent",
      label: "Check consent before sharing access notes",
      kind: "check_consent",
      href: "/ask",
    });
  }

  const workerFilters = needsSnapshotToWorkerFilters(snapshot);
  const params = new URLSearchParams();
  params.set("participantId", snapshot.participantId);
  if (query) params.set("q", query);
  if (workerFilters.serviceType) {
    params.set("serviceType", workerFilters.serviceType);
  }
  if (workerFilters.language) params.set("language", workerFilters.language);
  if (workerFilters.serviceRegion) {
    params.set("serviceRegion", workerFilters.serviceRegion);
  }
  if (workerFilters.wheelchairAccessible) {
    params.set("wheelchairAccessible", "true");
  }

  items.push({
    id: "rec-workers",
    label: "Find workers and providers from these needs",
    kind: "worker_search",
    href: `/worker-search?${params.toString()}`,
  });

  items.push({
    id: "rec-save",
    label: "Save needs assessment summary to your record",
    kind: "save_assessment",
  });

  return items;
}

function buildAssessmentDrafts(
  participantId: string,
  snapshot: ParticipantNeedsSnapshot,
  query: string,
): DraftPrmsRecord[] {
  return [
    {
      type: "NEEDS_ASSESSMENT_SUMMARY",
      status: "needs_confirmation",
      participantId,
      payload: {
        sourceQuery: query,
        summaryDomains: [...new Set(snapshot.signals.map((s) => s.domain))],
        gapDomains: snapshot.gaps.map((g) => g.domain),
        profileCompletionPercent: snapshot.profileCompletionPercent,
        signalCount: snapshot.signals.length,
        assessedAt: new Date().toISOString(),
      },
    },
  ];
}

function buildWorkerSearchQuery(
  snapshot: ParticipantNeedsSnapshot,
  query: string,
): string {
  const topSignals = snapshot.signals.slice(0, 3).map((s) => s.label);
  return [query, ...topSignals].filter(Boolean).join("; ") || "support worker";
}

async function emit(
  onEvent: StreamParams["onEvent"],
  event: NeedsAssessmentStreamEvent,
) {
  if (!onEvent) return;
  await onEvent(event);
}
