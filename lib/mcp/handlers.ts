import { planCopilotActions } from "@/lib/copilot/actionPlanner";
import { buildCopilotContext } from "@/lib/copilot/contextBuilder";
import { applyGuardrails } from "@/lib/copilot/guardrails";
import { classifyIntent } from "@/lib/copilot/intentRouter";
import { runShiftCreatorStream } from "@/lib/care/shift-creator/shift-creator-stream-service";
import { buildDeepLinks } from "@/lib/mcp/deep-links";
import {
  resolveMcpParticipantId,
  resolveMcpProviderActor,
} from "@/lib/mcp/resolve-mcp-actor";
import {
  formatToolResult,
  MAPABLE_RESULT_WIDGET_URI,
  type MapableToolPayload,
} from "@/lib/mcp/tool-results";
import { runNeedsAssessmentStream } from "@/lib/participant-needs/needs-assessment-stream-service";
import { runWorkerSearchStream } from "@/lib/search/worker-search-stream-service";
import { needsSnapshotToWorkerFilters } from "@/lib/participant-needs/needs-to-worker-filters";
import { buildParticipantNeedsSnapshot } from "@/lib/participant-needs/build-needs-snapshot";

export function handleGetCapabilities() {
  const deepLinks = buildDeepLinks();
  const payload: MapableToolPayload = {
    summary: "MapAble ChatGPT connector — read/plan tools only.",
    deepLinks,
    data: {
      tools: [
        "mapable_get_capabilities",
        "mapable_copilot_plan",
        "mapable_search_workers",
        "mapable_assess_needs",
        "mapable_plan_care_shift",
      ],
      governance: [
        "No writes from ChatGPT (no assign-worker, PRMS confirm, or booking create).",
        "Use deep links to complete actions in MapAble.",
      ],
    },
  };
  return formatToolResult(payload);
}

export async function handleCopilotPlan(params: {
  query: string;
  mode?: string;
  participantId?: string;
}) {
  const query = params.query.trim();
  const mode = params.mode?.trim() || "All";
  const participantId = resolveMcpParticipantId(params.participantId);

  const intent = classifyIntent(query, mode);
  const context = await buildCopilotContext(participantId);
  const planned = await planCopilotActions({
    query,
    mode,
    intent,
    context,
    sessionId: `chatgpt-mcp-${Date.now()}`,
    participantId,
  });
  const guarded = await applyGuardrails({
    planned,
    context,
    participantId,
  });

  const deepLinks = buildDeepLinks({ query, participantId });
  const assessmentUrl =
    intent.type === "needs_assessment"
      ? deepLinks.assessmentUrl
      : undefined;
  const shiftCreatorUrl =
    intent.type === "shift_creator" ? deepLinks.shiftCreatorUrl : undefined;

  const payload: MapableToolPayload = {
    summary: guarded.summary,
    deepLinks: {
      ...deepLinks,
      assessmentUrl: assessmentUrl ?? deepLinks.assessmentUrl,
      shiftCreatorUrl: shiftCreatorUrl ?? deepLinks.shiftCreatorUrl,
      askUrl: deepLinks.askUrl,
    },
    data: {
      intent: intent.type,
      confidence: intent.confidence,
      answer: guarded.plainLanguageAnswer,
      actions: guarded.actions,
      draftRecords: guarded.draftRecords,
      requiredConfirmations: guarded.requiredConfirmations,
      warnings: guarded.warnings,
      blockedActions: guarded.blockedActions,
    },
    widgetUri: MAPABLE_RESULT_WIDGET_URI,
    widgetState: {
      summary: guarded.summary,
      primaryUrl: shiftCreatorUrl ?? assessmentUrl ?? deepLinks.askUrl,
    },
  };

  return formatToolResult(payload);
}

export async function handleSearchWorkers(params: {
  query: string;
  participantId?: string;
}) {
  const query = params.query.trim();
  const participantId = resolveMcpParticipantId(params.participantId);

  const progress: string[] = [];
  let mergedFilters = { query };

  const snapshot = await buildParticipantNeedsSnapshot(participantId, query);
  if (snapshot) {
    mergedFilters = {
      ...needsSnapshotToWorkerFilters(snapshot),
      query,
    };
  }

  const result = await runWorkerSearchStream({
    query,
    filters: mergedFilters,
    onEvent: async (event) => {
      progress.push(event.message);
    },
  });

  const top = result.candidates.slice(0, 8);
  const deepLinks = buildDeepLinks({ query, participantId });

  const payload: MapableToolPayload = {
    summary: `Found ${result.candidates.length} ranked worker marketplace matches.`,
    deepLinks,
    data: {
      progress,
      filters: result.filters,
      candidates: top,
      totalCount: result.candidates.length,
    },
    widgetUri: MAPABLE_RESULT_WIDGET_URI,
    widgetState: {
      summary: `Top ${top.length} candidates`,
      primaryUrl: deepLinks.workerSearchUrl,
      candidates: top.map((c) => ({
        name: c.displayName,
        kind: c.kind,
        score: c.score,
      })),
    },
  };

  return formatToolResult(payload);
}

export async function handleAssessNeeds(params: {
  query?: string;
  participantId?: string;
}) {
  const participantId = resolveMcpParticipantId(params.participantId);
  const query = params.query?.trim() ?? "";

  const progress: string[] = [];
  const result = await runNeedsAssessmentStream({
    participantId,
    query,
    onEvent: async (event) => {
      progress.push(event.message);
    },
  });

  const deepLinks = buildDeepLinks({ query, participantId });

  const payload: MapableToolPayload = {
    summary: result.summary,
    deepLinks,
    data: {
      progress,
      recommendations: result.recommendations,
      suggestedActions: result.suggestedActions,
      gaps: result.snapshot.gaps,
      signalCount: result.snapshot.signals.length,
      draftRecords: result.draftRecords,
    },
    widgetUri: MAPABLE_RESULT_WIDGET_URI,
    widgetState: {
      summary: result.summary,
      primaryUrl: deepLinks.assessmentUrl,
    },
  };

  return formatToolResult(payload);
}

export async function handlePlanCareShift(params: {
  query: string;
  careBookingId?: string;
}) {
  const query = params.query.trim();
  const actor = await resolveMcpProviderActor();

  const progress: string[] = [];
  const result = await runShiftCreatorStream({
    query,
    careBookingId: params.careBookingId?.trim() || undefined,
    actorUser: actor,
    onEvent: async (event) => {
      progress.push(event.message);
    },
  });

  const deepLinks = buildDeepLinks({
    query,
    careBookingId: result.draft.careBookingId || params.careBookingId,
  });

  const summary = result.draft.bookingTitle
    ? `Shift draft for ${result.draft.bookingTitle}.`
    : "Shift draft needs a booking — clarify in MapAble.";

  const payload: MapableToolPayload = {
    summary,
    deepLinks,
    data: {
      progress,
      draft: result.draft,
      warnings: result.warnings,
      suggestedActions: result.suggestedActions,
      ambiguousBookings: result.ambiguousBookings,
      availableWorkers: result.availableWorkers?.slice(0, 10),
    },
    widgetUri: MAPABLE_RESULT_WIDGET_URI,
    widgetState: {
      summary,
      primaryUrl: deepLinks.shiftCreatorUrl,
      draft: result.draft,
    },
  };

  return formatToolResult(payload);
}
