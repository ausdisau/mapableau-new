import type { SearchInterpretation } from "@/types/search";

export const CLARIFICATION_CONFIDENCE_THRESHOLD = 0.55;

export function needsProviderFinderClarification(
  interpretation: SearchInterpretation,
): boolean {
  if (!interpretation.parsed) return false;
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
