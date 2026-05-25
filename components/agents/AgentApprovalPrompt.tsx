type Props = {
  onDismiss?: () => void;
};

export function AgentApprovalPrompt({ onDismiss }: Props) {
  return (
    <div
      className="rounded-lg border border-amber-600 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950 dark:text-amber-50"
      role="alertdialog"
      aria-labelledby="agent-approval-title"
    >
      <h3 id="agent-approval-title" className="font-semibold">
        Needs your confirmation
      </h3>
      <p className="mt-2 text-sm">
        The assistant prepared a draft. Review the details, then complete the action in
        the relevant MapAble page (Invoices, Incidents, Consent, or Support).
      </p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-3 min-h-11 rounded-md border border-current px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring"
        >
          I understand
        </button>
      ) : null}
    </div>
  );
}
