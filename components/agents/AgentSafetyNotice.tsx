type Props = {
  actionStatus: string;
  requiresHumanConfirmation?: boolean;
};

const LABELS: Record<string, { label: string; className: string }> = {
  drafted: { label: "Draft only", className: "border-border bg-muted" },
  requires_confirmation: {
    label: "Needs your confirmation",
    className: "border-amber-600 bg-amber-50 text-amber-950 dark:bg-amber-950 dark:text-amber-50",
  },
  requires_human_review: {
    label: "Needs staff review",
    className: "border-blue-600 bg-blue-50 text-blue-950 dark:bg-blue-950 dark:text-blue-50",
  },
  blocked: {
    label: "Blocked for safety",
    className: "border-destructive bg-destructive/10 text-destructive",
  },
};

export function AgentSafetyNotice({ actionStatus, requiresHumanConfirmation }: Props) {
  const config = LABELS[actionStatus] ?? LABELS.drafted;

  return (
    <div
      role="status"
      className={`rounded-lg border px-3 py-2 text-sm ${config.className}`}
      aria-label={`Agent status: ${config.label}`}
    >
      <span className="font-medium">{config.label}</span>
      {requiresHumanConfirmation ? (
        <p className="mt-1 text-sm opacity-90">
          MapAble assistants prepare drafts only. You or authorised staff must confirm
          before anything is submitted or paid.
        </p>
      ) : null}
    </div>
  );
}
