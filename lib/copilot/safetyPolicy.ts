import type { CopilotAction, CopilotWarning } from "@/lib/copilot/types";
import type { DraftPrmsRecord } from "@/lib/prms/types";

/** Imperative verbs that must never trigger silent official changes. */
export const FORBIDDEN_AUTO_ACTION_PATTERNS = [
  /\bbook\s+(it|now|this|me)\b/i,
  /\bauto[\s-]?book\b/i,
  /\bpay\s+(this|now|invoice)\b/i,
  /\bsubmit\s+(the\s+)?claim\b/i,
  /\bshare\s+(my|the)\s+(notes|details|records)\b/i,
  /\bclose\s+(the\s+)?incident\b/i,
  /\bfinali[sz]e\s+(payment|claim)\b/i,
] as const;

const SENSITIVE_ACTION_TYPES = new Set<CopilotAction["type"]>([
  "CREATE_DRAFT_SERVICE_EVENT",
  "INVOICE_REVIEW",
  "EVIDENCE_PACK_REVIEW",
  "INCIDENT_REPORT",
]);

const SENSITIVE_DRAFT_TYPES = new Set<DraftPrmsRecord["type"]>([
  "SERVICE_EVENT",
  "CARE_REQUEST",
  "TRANSPORT_REQUEST",
  "PLAN_MANAGEMENT_INVOICE",
  "INCIDENT",
]);

export type SafetyPolicyResult = {
  actions: CopilotAction[];
  blockedActions: CopilotAction[];
  warnings: CopilotWarning[];
};

export function warnOnImperativeQuery(query: string): CopilotWarning[] {
  const q = query.trim();
  if (!q) return [];

  const matched = FORBIDDEN_AUTO_ACTION_PATTERNS.some((p) => p.test(q));
  if (!matched) return [];

  return [
    {
      level: "info",
      message:
        "MapAble Co-Pilot only prepares drafts for your review. It does not book, pay, claim, share records, or close incidents without your explicit confirmation.",
    },
  ];
}

export function assertDraftOnlyActions(
  actions: CopilotAction[],
  draftRecords: DraftPrmsRecord[]
): SafetyPolicyResult {
  const blockedActions: CopilotAction[] = [];
  const keptActions: CopilotAction[] = [];
  const warnings: CopilotWarning[] = [];

  for (const action of actions) {
    if (!SENSITIVE_ACTION_TYPES.has(action.type)) {
      keptActions.push(action);
      continue;
    }

    if (!action.requiresConfirmation) {
      blockedActions.push(action);
      warnings.push({
        level: "warning",
        message: `“${action.label}” requires your confirmation before anything is saved.`,
      });
      continue;
    }

    const hasMatchingDraft = draftRecords.some(
      (d) =>
        SENSITIVE_DRAFT_TYPES.has(d.type) &&
        (d.status === "needs_confirmation" || d.status === "draft")
    );

    if (!hasMatchingDraft && SENSITIVE_ACTION_TYPES.has(action.type)) {
      blockedActions.push(action);
      warnings.push({
        level: "warning",
        message: `“${action.label}” is not available until a draft is prepared for your review.`,
      });
      continue;
    }

    keptActions.push(action);
  }

  return { actions: keptActions, blockedActions, warnings };
}

export function applySafetyPolicy(input: {
  query: string;
  actions: CopilotAction[];
  draftRecords: DraftPrmsRecord[];
  existingBlocked?: CopilotAction[];
}): SafetyPolicyResult {
  const imperativeWarnings = warnOnImperativeQuery(input.query);
  const draftOnly = assertDraftOnlyActions(input.actions, input.draftRecords);

  return {
    actions: draftOnly.actions,
    blockedActions: [
      ...(input.existingBlocked ?? []),
      ...draftOnly.blockedActions,
    ],
    warnings: [...imperativeWarnings, ...draftOnly.warnings],
  };
}
