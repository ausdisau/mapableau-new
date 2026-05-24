export type PlanExtractionDraft = {
  goals: { title: string; confidence: number }[];
  budgetCategories: { name: string; note: string; confidence: number }[];
  planDates?: { start?: string; end?: string };
  uncertainties: string[];
};

export async function extractPlanFromDocument(_storageKey: string): Promise<PlanExtractionDraft> {
  return {
    goals: [
      {
        title: "Example goal — please edit",
        confidence: 0.4,
      },
    ],
    budgetCategories: [
      {
        name: "Core supports",
        note: "Placeholder — verify against your plan",
        confidence: 0.3,
      },
    ],
    uncertainties: [
      "OCR adapter is in placeholder mode. Review all fields carefully.",
    ],
  };
}
