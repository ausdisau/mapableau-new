const STEPS = [
  { key: "assigned", label: "Assigned" },
  { key: "pickup", label: "At pickup" },
  { key: "onboard", label: "On board" },
  { key: "done", label: "Complete" },
] as const;

export type TripStep = (typeof STEPS)[number]["key"];

export function TripStatusStepper({ current }: { current: TripStep }) {
  const index = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Trip status">
      {STEPS.map((step, i) => {
        const state =
          i < index ? "done" : i === index ? "current" : "upcoming";
        return (
          <li
            key={step.key}
            className={`rounded-lg px-2 py-3 text-center text-xs font-semibold ${
              state === "current"
                ? "bg-primary text-primary-foreground"
                : state === "done"
                  ? "bg-secondary/20"
                  : "bg-muted text-muted-foreground"
            }`}
            aria-current={state === "current" ? "step" : undefined}
          >
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}
