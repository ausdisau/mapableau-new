"use client";

import type { CareFinanceStatus } from "@/lib/integrations/orchestration/care-finance-slice";

type Props = {
  status: CareFinanceStatus;
  onRetry?: () => void;
  onRequestHumanHelp?: () => void;
};

/**
 * Accessible participant/operator status for the Care finance integration slice.
 * Keyboard operable; clear state; persistent retry; no auto time-out.
 */
export function CareFinanceStatusPanel({
  status,
  onRetry,
  onRequestHumanHelp,
}: Props) {
  return (
    <section
      aria-labelledby="care-finance-status-heading"
      className="care-finance-status"
    >
      <h2 id="care-finance-status-heading">Booking and billing status</h2>
      <p>
        Human review is required before roster publish, invoice authorisation, or
        card payment. Failed steps stay available to retry.
      </p>

      <ol aria-label="Integration steps">
        {status.steps.map((step) => (
          <li key={step.step}>
            <div>
              <strong>{labelForStep(step.step)}</strong>
              <span
                role="status"
                aria-label={`${labelForStep(step.step)} is ${step.state}`}
              >
                {" "}
                — {step.state.replaceAll("_", " ")}
              </span>
            </div>
            {step.detail ? <p>{step.detail}</p> : null}
          </li>
        ))}
      </ol>

      {status.fundingDecision ? (
        <div>
          <h3>Funding</h3>
          <p>
            {status.fundingDecision.allowed
              ? status.stripeCheckoutEligible
                ? "Stripe Checkout may be used after authorisation."
                : "Checkout-eligible funding, but the direct booking flag is off."
              : status.fundingDecision.instruction}
          </p>
        </div>
      ) : null}

      <div className="care-finance-actions">
        {onRetry ? (
          <button type="button" onClick={onRetry}>
            Retry failed steps
          </button>
        ) : null}
        {onRequestHumanHelp ? (
          <button type="button" onClick={onRequestHumanHelp}>
            Request human assistance
          </button>
        ) : null}
      </div>
    </section>
  );
}

function labelForStep(step: CareFinanceStatus["steps"][number]["step"]): string {
  switch (step) {
    case "deputy_draft_roster":
      return "Workforce draft roster";
    case "billing_review":
      return "Billing review";
    case "xero_draft_invoice":
      return "Accounting draft invoice";
    case "funding_collection":
      return "Payment or plan-manager export";
    case "compensate_cancel":
      return "Cancellation compensation";
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}
