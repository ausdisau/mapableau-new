import type { SearchInterpretation } from "@/types/search";

export const CLARIFICATION_CONFIDENCE_THRESHOLD = 0.55;
export const ACCESS_NEEDS_CLARIFICATION_CONFIDENCE = 0.4;

export function hasUnresolvedAccessNeeds(
  interpretation: SearchInterpretation,
): boolean {
  if (!interpretation.filters.access?.trim()) return false;
  if (interpretation.accessNeedIds.length > 0) return false;
  const resolution = interpretation.accessNeeds;
  if (!resolution) return true;
  return resolution.confidence < ACCESS_NEEDS_CLARIFICATION_CONFIDENCE;
}

export function needsProviderFinderClarification(
  interpretation: SearchInterpretation,
): boolean {
  if (!interpretation.parsed) return false;

  if (hasUnresolvedAccessNeeds(interpretation)) return true;

  if (interpretation.confidence >= CLARIFICATION_CONFIDENCE_THRESHOLD) {
    return false;
  }
  const hasLocation = Boolean(interpretation.filters.location?.trim());
  const hasService = Boolean(
    interpretation.filters.service?.trim() ||
      interpretation.serviceCategorySlug?.trim(),
  );
  return !hasLocation || !hasService;
}

export function buildClarificationQuestion(
  interpretation: SearchInterpretation,
): string {
  if (hasUnresolvedAccessNeeds(interpretation)) {
    return "Which access needs matter most — for example wheelchair access, Auslan, low sensory, or hoist support?";
  }

  const hasLocation = Boolean(interpretation.filters.location?.trim());
  const hasService = Boolean(
    interpretation.filters.service?.trim() ||
      interpretation.serviceCategorySlug?.trim(),
  );

  if (!hasService) {
    return "What type of support are you looking for — for example occupational therapy, a support worker, or transport?";
  }
  if (!hasLocation) {
    return "Which suburb or postcode should I search near?";
  }
  return "Could you add a bit more detail — suburb or postcode and the type of support you need?";
}
