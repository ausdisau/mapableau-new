/**
 * Post-plan Ask MapAble manager enrichment — deterministic, no second LLM client.
 */

import {
  buildAskPersonaAnswerEnvelope,
  buildConstraintPreservationNote,
  extractHardAccessConstraints,
  formatEvidenceLabel,
  preservesHardConstraints,
  routeSpecialists,
  type AskPageContext,
} from "@/lib/ask-mapable";
import type {
  AskMapAbleMeta,
  CopilotAction,
  CopilotActionPlan,
  CopilotAskResponse,
  CopilotIntentType,
} from "@/lib/copilot/types";

function ensureHumanAction(actions: CopilotAction[]): CopilotAction[] {
  if (actions.some((a) => a.type === "SAFETY_ESCALATION")) {
    return actions;
  }
  return [
    ...actions,
    {
      type: "SAFETY_ESCALATION",
      label: "Talk to a person",
      requiresConfirmation: false,
      href: "/contact",
    },
  ];
}

export function enrichAskMapAblePlan(input: {
  planned: CopilotActionPlan;
  intent: CopilotIntentType;
  query: string;
  pageContext?: AskPageContext;
}): CopilotActionPlan {
  const constraints = extractHardAccessConstraints(input.query);
  const route = routeSpecialists(input.intent, input.query);
  const constraintsNote = buildConstraintPreservationNote(constraints);

  let answer = input.planned.plainLanguageAnswer;
  const evidenceNotes: string[] = [];

  if (input.intent === "places" || constraints.length > 0) {
    evidenceNotes.push(
      formatEvidenceLabel({
        state: "UNKNOWN",
        provenance: "ai_inference",
        summary:
          "Ask MapAble does not invent accessibility verification. Missing data is UNKNOWN — not “not accessible”.",
      }),
    );
  }

  if (constraints.length >= 2 && !preservesHardConstraints(input.query, answer, constraints)) {
    answer = `${answer}\n\nI will keep all of your hard access requirements (${constraints
      .map((c) => c.label)
      .join("; ")}). If no verified result meets every requirement, I will say so rather than relax them.`;
  }

  answer = buildAskPersonaAnswerEnvelope({
    answer,
    constraintsNote,
    evidenceNotes,
    specialistReason: route.reason,
  });

  const warnings = [...input.planned.warnings];
  if (constraints.length > 0) {
    warnings.push({
      level: "info",
      message: constraintsNote ?? "Access requirements are treated as hard requirements.",
    });
  }

  if (input.intent === "ndis" || input.intent === "billing") {
    warnings.push({
      level: "info",
      message:
        "Ask MapAble explains information only. It does not decide NDIS eligibility, approve claims, or submit claims.",
    });
  }

  const filters = {
    ...input.planned.filters,
    askMapAble: {
      brand: "Ask MapAble",
      specialist: route,
      hardAccessConstraints: constraints.map((c) => c.id),
      pageModule: input.pageContext?.mapableModule,
    },
  };

  return {
    ...input.planned,
    plainLanguageAnswer: answer,
    actions: ensureHumanAction(input.planned.actions),
    warnings,
    filters,
    toolsCalled: [
      ...(input.planned.toolsCalled ?? []),
      `consult_${route.primary}_specialist`,
    ],
  };
}

export function buildAskMetaFromFilters(
  filters: Record<string, unknown>,
): AskMapAbleMeta | undefined {
  const raw = filters.askMapAble;
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const specialist = o.specialist as
    | { primary?: string; supporting?: string[]; reason?: string }
    | undefined;
  return {
    brand: "Ask MapAble",
    specialistPrimary: specialist?.primary,
    specialistSupporting: specialist?.supporting,
    specialistReason: specialist?.reason,
    hardAccessConstraints: Array.isArray(o.hardAccessConstraints)
      ? (o.hardAccessConstraints as string[])
      : undefined,
    pageModule: typeof o.pageModule === "string" ? o.pageModule : undefined,
  };
}

export function attachAskMeta(
  response: CopilotAskResponse,
): CopilotAskResponse {
  const askMeta = buildAskMetaFromFilters(response.filters);
  if (!askMeta) {
    return {
      ...response,
      askMeta: { brand: "Ask MapAble" },
      actions: ensureHumanAction(response.actions),
    };
  }
  return {
    ...response,
    askMeta,
    actions: ensureHumanAction(response.actions),
  };
}
