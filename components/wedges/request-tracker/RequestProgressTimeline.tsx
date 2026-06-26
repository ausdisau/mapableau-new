import { buildRequestTimeline, requestProgressStatusLabel } from "@/lib/wedges/request-tracker/status";
import type { RequestProgress } from "@/types/wedges";

export function RequestProgressTimeline({ progress }: { progress: RequestProgress }) {
  const steps = buildRequestTimeline(progress);

  return (
    <section aria-labelledby="request-timeline-heading">
      <h2 id="request-timeline-heading" className="font-heading text-lg font-semibold">
        Request progress
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Status: {requestProgressStatusLabel(progress.status)}
      </p>

      <ol className="mt-4 space-y-0" aria-label="Request progress timeline">
        {steps.map((step, idx) => (
          <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {idx < steps.length - 1 ? (
              <span
                className="absolute left-[11px] top-6 h-full w-0.5 bg-border"
                aria-hidden
              />
            ) : null}
            <span
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                step.completed
                  ? "border-primary bg-primary text-primary-foreground"
                  : step.current
                    ? "border-primary bg-background text-primary"
                    : "border-border bg-muted text-muted-foreground"
              }`}
              aria-current={step.current ? "step" : undefined}
            >
              {step.completed ? "✓" : idx + 1}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className={`text-sm font-medium ${step.current ? "text-foreground" : ""}`}>
                {step.label}
              </p>
              {step.timestamp ? (
                <p className="text-xs text-muted-foreground">
                  {new Date(step.timestamp).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {progress.blockers.length > 0 ? (
        <div className="mt-4 rounded-lg border border-border p-3" role="status">
          <p className="text-sm font-medium">Blockers</p>
          <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
            {progress.blockers.map((b) => (
              <li key={b}>{b.replace(/_/g, " ")}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
