type ReasoningSummaryCollapsibleProps = {
  summary: string;
};

/** Short reasoning summary only — never raw chain-of-thought. Collapsed by default. */
export function ReasoningSummaryCollapsible({ summary }: ReasoningSummaryCollapsibleProps) {
  return (
    <details className="mt-2 text-sm text-slate-600">
      <summary className="cursor-pointer font-medium">Why this answer</summary>
      <p className="mt-1">{summary}</p>
    </details>
  );
}
