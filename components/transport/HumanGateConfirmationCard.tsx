"use client";

type Props = {
  confirmed: boolean;
  onConfirmedChange: (next: boolean) => void;
  summaryLines: string[];
  id?: string;
};

/**
 * Step 04 — explicit participant confirmation before submit.
 * Blocks silent auto-assign; copy states human dispatch review.
 */
export function HumanGateConfirmationCard({
  confirmed,
  onConfirmedChange,
  summaryLines,
  id = "human-gate-confirm",
}: Props) {
  return (
    <div className="tb-surface space-y-3 p-4">
      <h3 className="font-heading text-base font-semibold">
        <span className="tb-step-number">04</span>
        {" · "}Confirm human gate
      </h3>
      <p className="tb-ink-secondary text-sm">
        MapAble will not auto-assign a driver. A verified human dispatcher
        reviews vehicle fit after you confirm.
      </p>
      {summaryLines.length > 0 ? (
        <ul className="tb-surface-muted list-disc space-y-1 p-3 pl-6 text-sm">
          {summaryLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      <label
        htmlFor={id}
        className="flex min-h-[48px] cursor-pointer items-start gap-3 text-sm"
      >
        <input
          id={id}
          type="checkbox"
          className="mt-1 h-5 w-5"
          checked={confirmed}
          onChange={(e) => onConfirmedChange(e.target.checked)}
        />
        <span>
          I confirm these details and request human-gated transport review. I
          understand this is not NDIS funding approval and not an emergency
          service.
        </span>
      </label>
    </div>
  );
}
