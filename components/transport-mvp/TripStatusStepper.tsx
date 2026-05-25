import type { TransportMvpTripStatus } from "@prisma/client";

import { MVP_STATUS_STEPPER, plainLanguageMvpStatus } from "@/lib/transport-mvp/trip-lifecycle-service";

export function TripStatusStepper({
  currentStatus,
}: {
  currentStatus: TransportMvpTripStatus;
}) {
  const currentIndex = MVP_STATUS_STEPPER.indexOf(currentStatus);
  const isTerminal = currentStatus === "cancelled" || currentStatus === "disputed";

  if (isTerminal) {
    return (
      <p className="rounded-lg border border-amber-600/40 bg-amber-50 p-3 text-sm dark:bg-amber-950/30" role="status">
        Trip status: {plainLanguageMvpStatus(currentStatus)}
      </p>
    );
  }

  return (
    <ol className="space-y-2" aria-label="Trip progress">
      {MVP_STATUS_STEPPER.map((step, index) => {
        const done = currentIndex > index;
        const current = currentStatus === step;
        return (
          <li
            key={step}
            className="flex items-start gap-3 rounded-lg border p-3"
            aria-current={current ? "step" : undefined}
          >
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                done
                  ? "bg-primary text-primary-foreground"
                  : current
                    ? "ring-2 ring-ring bg-primary/20"
                    : "bg-muted text-muted-foreground"
              }`}
              aria-hidden
            >
              {done ? "✓" : index + 1}
            </span>
            <span className={current ? "font-semibold" : "text-muted-foreground"}>
              {plainLanguageMvpStatus(step)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
