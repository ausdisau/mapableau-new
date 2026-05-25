import { GraphCardShell } from "@/components/mapable-graphs/GraphCardShell";

type Props = {
  actionReviewed: string;
  riskTier: string;
  outcome: string;
  checkpointRequired: boolean;
  explanation: string;
  humanReviewRequired?: boolean;
};

export function GuardrailDecisionCard({
  actionReviewed,
  riskTier,
  outcome,
  checkpointRequired,
  explanation,
  humanReviewRequired,
}: Props) {
  return (
    <GraphCardShell
      title="Safety and policy check"
      description="MapAble explains what is allowed before anything important happens."
    >
      <dl className="space-y-3">
        <div>
          <dt className="font-semibold">Action reviewed</dt>
          <dd>{actionReviewed}</dd>
        </div>
        <div>
          <dt className="font-semibold">Risk level</dt>
          <dd>{riskTier.replace(/_/g, " ")}</dd>
        </div>
        <div>
          <dt className="font-semibold">Decision</dt>
          <dd>{outcome.replace(/_/g, " ")}</dd>
        </div>
      </dl>

      <p className="leading-relaxed">{explanation}</p>

      {checkpointRequired ? (
        <p
          role="status"
          className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 font-medium"
        >
          Your confirmation or a human review is required before this continues.
        </p>
      ) : null}

      {humanReviewRequired ? (
        <p role="alert" className="font-medium text-amber-800 dark:text-amber-200">
          A safeguarding or compliance review may be needed. Normal booking may
          be paused until this is resolved.
        </p>
      ) : null}
    </GraphCardShell>
  );
}
