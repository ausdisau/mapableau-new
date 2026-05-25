const steps = ["scheduled", "checked_in", "checked_out", "completed"];

export function ShiftStatusStepper({ status }: { status: string }) {
  const currentIndex = Math.max(0, steps.findIndex((step) => status.includes(step)));
  return (
    <ol className="grid grid-cols-4 gap-2 text-xs">
      {steps.map((step, index) => (
        <li
          key={step}
          className={`rounded-full border px-2 py-1 text-center ${
            index <= currentIndex ? "bg-primary text-primary-foreground" : ""
          }`}
        >
          {step.replace(/_/g, " ")}
        </li>
      ))}
    </ol>
  );
}
const STEPS = [
  { statuses: ["scheduled", "worker_assigned", "confirmed"], label: "Scheduled" },
  { statuses: ["worker_en_route", "checked_in", "in_progress"], label: "In progress" },
  { statuses: ["checked_out", "awaiting_participant_approval"], label: "Awaiting approval" },
  { statuses: ["approved", "completed"], label: "Completed" },
] as const;

export function ShiftStatusStepper({ status }: { status: string }) {
  const current = Math.max(
    0,
    STEPS.findIndex((step) => step.statuses.includes(status as never))
  );

  return (
    <ol className="grid gap-2 sm:grid-cols-4" aria-label="Shift progress">
      {STEPS.map((step, index) => {
        const state =
          index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li
            key={step.label}
            aria-current={state === "current" ? "step" : undefined}
            className={
              state === "current"
                ? "rounded-lg bg-primary p-3 text-center text-sm font-semibold text-primary-foreground"
                : state === "done"
                  ? "rounded-lg bg-green-100 p-3 text-center text-sm font-semibold text-green-900"
                  : "rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground"
            }
          >
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}
