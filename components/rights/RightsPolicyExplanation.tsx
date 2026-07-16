import type { RightsPolicyOutcome } from "@/lib/rights-os/types";

type RightsPolicyExplanationProps = {
  decision: RightsPolicyOutcome;
  reasons: string[];
  allowedSummary: string;
  deniedSummary?: string;
  participantAction: string;
  recipientName?: string;
  purposeCode?: string;
};

export function RightsPolicyExplanation({
  decision,
  reasons,
  allowedSummary,
  deniedSummary,
  participantAction,
  recipientName,
  purposeCode,
}: RightsPolicyExplanationProps) {
  return (
    <section
      className="rounded-lg border bg-card p-4"
      aria-labelledby="rights-policy-explanation-heading"
    >
      <h2 id="rights-policy-explanation-heading" className="font-heading text-lg font-semibold">
        Policy explanation
      </h2>
      {recipientName ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Recipient: {recipientName}
          {purposeCode ? ` · Purpose: ${purposeCode}` : ""}
        </p>
      ) : null}
      <p className="mt-3 font-medium">Decision: {decision.replaceAll("_", " ")}</p>
      <p className="mt-2 text-sm">{allowedSummary}</p>
      {deniedSummary ? <p className="mt-1 text-sm text-muted-foreground">{deniedSummary}</p> : null}
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p className="mt-4 text-sm font-medium">Your action: {participantAction}</p>
    </section>
  );
}
