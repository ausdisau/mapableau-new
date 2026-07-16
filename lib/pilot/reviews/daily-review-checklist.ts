export type ChecklistItem = {
  key: string;
  label: string;
  required: boolean;
};

export const DAILY_REVIEW_CHECKLIST: readonly ChecklistItem[] = [
  { key: "limits", label: "Exposure within limits", required: true },
  { key: "signals", label: "Safety signals reviewed", required: true },
  { key: "incidents", label: "Incidents reviewed", required: true },
  { key: "complaints", label: "Complaints reviewed", required: true },
  { key: "enrolments", label: "Enrolments/consent status", required: true },
  { key: "accessibility", label: "Accessibility issues", required: false },
  { key: "reconciliation", label: "Daily reconciliation", required: true },
  { key: "ops_handover", label: "Ops handover current", required: true },
];

export function checklistComplete(
  answers: Record<string, boolean>
): { complete: boolean; missing: string[] } {
  const missing = DAILY_REVIEW_CHECKLIST.filter(
    (i) => i.required && answers[i.key] !== true
  ).map((i) => i.key);
  return { complete: missing.length === 0, missing };
}
