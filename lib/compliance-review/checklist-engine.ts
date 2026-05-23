export type ChecklistId =
  | "accessibility"
  | "privacy"
  | "cybersecurity"
  | "ndis_code_of_conduct"
  | "data_sharing"
  | "billing_safety";

export type ChecklistItem = {
  id: string;
  prompt: string;
  severity: "low" | "medium" | "high";
};

export const CHECKLISTS: Record<ChecklistId, ChecklistItem[]> = {
  accessibility: [
    {
      id: "a11y-keyboard",
      prompt: "Can all flows be completed with keyboard only?",
      severity: "high",
    },
    {
      id: "a11y-forms",
      prompt: "Do forms expose errors in plain language at the top?",
      severity: "medium",
    },
  ],
  privacy: [
    {
      id: "privacy-minimisation",
      prompt: "Is participant data minimised in worker/driver views?",
      severity: "high",
    },
  ],
  cybersecurity: [
    {
      id: "sec-secrets",
      prompt: "Are API secrets server-side only?",
      severity: "high",
    },
  ],
  ndis_code_of_conduct: [
    {
      id: "ndis-choice",
      prompt: "Does the flow preserve participant choice and control?",
      severity: "high",
    },
  ],
  data_sharing: [
    {
      id: "share-consent",
      prompt: "Is consent checked before coordinator access?",
      severity: "high",
    },
  ],
  billing_safety: [
    {
      id: "billing-plain",
      prompt: "Are claimable vs gap amounts explained plainly?",
      severity: "medium",
    },
  ],
};

export function runChecklist(checklistId: ChecklistId) {
  return (CHECKLISTS[checklistId] ?? []).map((item) => ({
    ...item,
    status: "draft" as const,
    recommendation: `Review: ${item.prompt}`,
  }));
}
