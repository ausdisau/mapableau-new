export type LensDraftObservation = {
  features: { type: string; confidence: number; note: string }[];
  uncertainties: string[];
};

export async function analyseLensImage(_storageKey: string): Promise<LensDraftObservation> {
  return {
    features: [
      {
        type: "step_free_entry",
        confidence: 0.35,
        note: "Possible level entry — human review required",
      },
    ],
    uncertainties: [
      "Automated analysis is uncertain. A reviewer must confirm before publishing.",
    ],
  };
}
