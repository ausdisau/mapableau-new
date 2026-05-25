const STEPS = [
  { key: "scheduled", label: "Scheduled" },
  { key: "started", label: "In progress" },
  { key: "completed", label: "Completed" },
] as const;

export type ShiftStep = (typeof STEPS)[number]["key"];

export function ShiftStatusStepper({ current }: { current: ShiftStep }) {
  const index = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="flex gap-2" aria-label="Shift status">
      {STEPS.map((step, i) => {
        const state =
          i < index ? "done" : i === index ? "current" : "upcoming";
        return (
          <li
            key={step.key}
            className={`flex-1 rounded-lg px-2 py-3 text-center text-xs font-semibold ${
              state === "current"
                ? "bg-primary text-primary-foreground"
                : state === "done"
                  ? "bg-secondary/20 text-secondary"
                  : "bg-muted text-muted-foreground"
            }`}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className="sr-only">
              {state === "current" ? "Current: " : ""}
            </span>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}
