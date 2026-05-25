const STEPS = [
  "submitted",
  "confirmed",
  "preparing",
  "packed",
  "out_for_delivery",
  "delivered",
  "handover_confirmed",
] as const;

export function FoodOrderStatusTracker({
  status,
  deliveryStatus,
}: {
  status: string;
  deliveryStatus: string;
}) {
  const active =
    deliveryStatus === "handover_confirmed" || deliveryStatus === "delivered"
      ? "handover_confirmed"
      : deliveryStatus !== "not_assigned"
        ? deliveryStatus
        : status;

  const idx = STEPS.indexOf(active as (typeof STEPS)[number]);

  return (
    <ol className="flex flex-wrap gap-2" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const done = idx >= 0 && i <= idx;
        const current = step === active;
        return (
          <li
            key={step}
            className={`rounded-full border px-2 py-1 text-xs capitalize ${
              done ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
            } ${current ? "ring-2 ring-primary" : ""}`}
            aria-current={current ? "step" : undefined}
          >
            {step.replace(/_/g, " ")}
          </li>
        );
      })}
    </ol>
  );
}
