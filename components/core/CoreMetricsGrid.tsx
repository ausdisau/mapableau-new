import { cn } from "@/app/lib/utils";

function formatMetricValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString("en-AU")
      : value.toLocaleString("en-AU", { maximumFractionDigits: 4 });
  }
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((v) => formatMetricValue(v)).join(", ");
  }
  return JSON.stringify(value);
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function MetricEntries({
  data,
  depth = 0,
}: {
  data: Record<string, unknown>;
  depth?: number;
}) {
  return (
    <dl
      className={cn(
        "grid gap-3 sm:grid-cols-2",
        depth > 0 && "mt-2 rounded-lg border border-border/50 bg-muted/30 p-3"
      )}
    >
      {Object.entries(data).map(([key, value]) => {
        const label = humanizeKey(key);
        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
          return (
            <div key={key} className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1">
                <MetricEntries data={value as Record<string, unknown>} depth={depth + 1} />
              </dd>
            </div>
          );
        }
        return (
          <div key={key}>
            <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 text-sm font-medium tabular-nums">{formatMetricValue(value)}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export function CoreMetricsGrid({
  metrics,
  suppressed,
  suppressionMessage = "Some metrics suppressed (small cell)",
  debug = false,
  className,
}: {
  metrics: Record<string, unknown> | null | undefined;
  suppressed?: boolean;
  suppressionMessage?: string;
  debug?: boolean;
  className?: string;
}) {
  const data =
    metrics && typeof metrics === "object" && !Array.isArray(metrics)
      ? (metrics as Record<string, unknown>)
      : {};

  const hasEntries = Object.keys(data).length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      {suppressed ? (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          {suppressionMessage}
        </p>
      ) : null}
      {hasEntries ? (
        <MetricEntries data={data} />
      ) : (
        <p className="text-sm text-muted-foreground">No published metrics for this period.</p>
      )}
      {debug && hasEntries ? (
        <pre className="mt-2 overflow-x-auto rounded border bg-muted/50 p-2 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
