import type {
  ClarificationChoice,
  ClarificationSlot,
  CopilotAgentMeta,
  CopilotProviderResult,
} from "@/lib/copilot/types";
import { ACCESS_NEEDS, SUPPORT_TYPES } from "@/lib/provider/finder/filters";
import type { SearchInterpretation } from "@/types/search";

export const CLARIFICATION_CONFIDENCE_THRESHOLD = 0.55;
export const ACCESS_NEEDS_CLARIFICATION_CONFIDENCE = 0.4;

export const SKIP_CLARIFICATION_VALUES = ["Skip", "Not sure"] as const;

export function isSkipClarificationValue(value: string): boolean {
  const trimmed = value.trim();
  return SKIP_CLARIFICATION_VALUES.some(
    (label) => label.toLowerCase() === trimmed.toLowerCase(),
  );
}

export function hasUnresolvedAccessNeeds(
  interpretation: SearchInterpretation,
): boolean {
  if (!interpretation.filters.access?.trim()) return false;
  if (interpretation.accessNeedIds.length > 0) return false;
  const resolution = interpretation.accessNeeds;
  if (!resolution) return true;
  return resolution.confidence < ACCESS_NEEDS_CLARIFICATION_CONFIDENCE;
}

function skipped(
  slots: readonly ClarificationSlot[] | undefined,
  slot: ClarificationSlot,
): boolean {
  return Boolean(slots?.includes(slot));
}

export function needsProviderFinderClarification(
  interpretation: SearchInterpretation,
  skippedSlots: readonly ClarificationSlot[] = [],
): boolean {
  if (!interpretation.parsed) return false;

  if (
    hasUnresolvedAccessNeeds(interpretation) &&
    !skipped(skippedSlots, "access")
  ) {
    return true;
  }

  if (interpretation.confidence >= CLARIFICATION_CONFIDENCE_THRESHOLD) {
    return false;
  }
  const hasLocation =
    Boolean(interpretation.filters.location?.trim()) ||
    skipped(skippedSlots, "location");
  const hasService =
    Boolean(
      interpretation.filters.service?.trim() ||
        interpretation.serviceCategorySlug?.trim(),
    ) || skipped(skippedSlots, "service");
  return !hasLocation || !hasService;
}

export function buildClarificationQuestion(
  interpretation: SearchInterpretation,
  skippedSlots: readonly ClarificationSlot[] = [],
): string {
  if (
    hasUnresolvedAccessNeeds(interpretation) &&
    !skipped(skippedSlots, "access")
  ) {
    return "Which access needs matter most — for example wheelchair access, Auslan, text/written communication, or hoist support? You can skip if you are not sure.";
  }

  const hasLocation =
    Boolean(interpretation.filters.location?.trim()) ||
    skipped(skippedSlots, "location");
  const hasService =
    Boolean(
      interpretation.filters.service?.trim() ||
        interpretation.serviceCategorySlug?.trim(),
    ) || skipped(skippedSlots, "service");

  if (!hasService) {
    return "What type of support are you looking for — for example occupational therapy, a support worker, or transport? You can skip if you are not sure.";
  }
  if (!hasLocation) {
    return "Which suburb or postcode should I search near? You can skip if you are not sure.";
  }
  return "Could you add a bit more detail — suburb or postcode and the type of support you need? You can skip if you are not sure.";
}

function resolveClarificationSlot(
  interpretation: SearchInterpretation,
  skippedSlots: readonly ClarificationSlot[] = [],
): ClarificationSlot {
  if (
    hasUnresolvedAccessNeeds(interpretation) &&
    !skipped(skippedSlots, "access")
  ) {
    return "access";
  }

  const hasLocation =
    Boolean(interpretation.filters.location?.trim()) ||
    skipped(skippedSlots, "location");
  const hasService =
    Boolean(
      interpretation.filters.service?.trim() ||
        interpretation.serviceCategorySlug?.trim(),
    ) || skipped(skippedSlots, "service");

  if (!hasService) return "service";
  if (!hasLocation) return "location";
  return "general";
}

export function getFilledSlots(
  interpretation: SearchInterpretation,
  skippedSlots: readonly ClarificationSlot[] = [],
): Partial<Record<ClarificationSlot, boolean>> {
  const hasLocation = Boolean(interpretation.filters.location?.trim());
  const hasService = Boolean(
    interpretation.filters.service?.trim() ||
      interpretation.serviceCategorySlug?.trim(),
  );
  const hasAccess =
    interpretation.accessNeedIds.length > 0 ||
    (!interpretation.filters.access?.trim() &&
      (interpretation.accessNeeds?.confidence ?? 0) >=
        ACCESS_NEEDS_CLARIFICATION_CONFIDENCE);

  return {
    location: hasLocation || skipped(skippedSlots, "location"),
    service: hasService || skipped(skippedSlots, "service"),
    access: hasAccess || skipped(skippedSlots, "access"),
  };
}

export function getClarificationGuidance(
  interpretation: SearchInterpretation,
  skippedSlots: readonly ClarificationSlot[] = [],
): {
  clarificationSlot?: ClarificationSlot;
  suggestedChoices?: ClarificationChoice[];
  filledSlots: Partial<Record<ClarificationSlot, boolean>>;
} {
  const filledSlots = getFilledSlots(interpretation, skippedSlots);

  if (!needsProviderFinderClarification(interpretation, skippedSlots)) {
    return { filledSlots };
  }

  const clarificationSlot = resolveClarificationSlot(
    interpretation,
    skippedSlots,
  );
  let suggestedChoices: ClarificationChoice[] | undefined;

  if (clarificationSlot === "access") {
    suggestedChoices = ACCESS_NEEDS.map((need) => ({
      label: need.label,
      value: need.label,
    }));
  } else if (clarificationSlot === "service") {
    suggestedChoices = SUPPORT_TYPES.filter((type) => type.id !== "all").map(
      (type) => ({
        label: type.label,
        value: type.label,
      }),
    );
  }

  return {
    clarificationSlot,
    suggestedChoices,
    filledSlots,
  };
}

export function enrichCopilotAgentMeta(
  agent: CopilotAgentMeta,
  interpretation: SearchInterpretation,
  providerResults?: CopilotProviderResult[],
  skippedSlots: readonly ClarificationSlot[] = [],
): CopilotAgentMeta {
  const guidance = getClarificationGuidance(interpretation, skippedSlots);
  return {
    ...agent,
    ...guidance,
    providerResults:
      agent.status === "complete" ? providerResults : undefined,
  };
}
