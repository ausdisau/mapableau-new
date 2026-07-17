import Link from "next/link";

import { DemonstrationBanner } from "@/components/accountability/DemonstrationBanner";
import { SuppressedDataNotice } from "@/components/accountability/SuppressedDataNotice";
import type { PublicMetricCard } from "@/lib/accountability/types";

function formatValue(metric: PublicMetricCard): string {
  if (metric.value == null) return "—";
  if (metric.unit === "percentage") return `${metric.value}%`;
  if (metric.unit === "duration") return `${metric.value}`;
  return String(metric.value);
}

function statusLabel(status: PublicMetricCard["statusAgainstTarget"]): string {
  switch (status) {
    case "met":
      return "Met target";
    case "on_track":
      return "On track";
    case "missed":
      return "Missed target";
    case "suppressed":
      return "Not published";
    case "unknown":
      return "No target set";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function AccountabilityMetricCard({ metric }: { metric: PublicMetricCard }) {
  return (
    <article
      className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4"
      aria-labelledby={`metric-${metric.publicCode}`}
    >
      <DemonstrationBanner show={metric.isDemonstration} />
      <h3
        id={`metric-${metric.publicCode}`}
        className="mt-2 font-heading text-base font-semibold"
      >
        {metric.name}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{metric.domain}</p>
      {metric.suppressionReason ? (
        <div className="mt-3">
          <SuppressedDataNotice />
        </div>
      ) : (
        <p className="mt-3 font-heading text-3xl font-bold text-primary">
          {formatValue(metric)}
        </p>
      )}
      <p className="mt-2 text-sm">{metric.accessibleSummary}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>
          <dt>Numerator</dt>
          <dd>{metric.numerator ?? "—"}</dd>
        </div>
        <div>
          <dt>Denominator</dt>
          <dd>{metric.denominator ?? "—"}</dd>
        </div>
        <div>
          <dt>Sample size</dt>
          <dd>{metric.sampleSize ?? "—"}</dd>
        </div>
        <div>
          <dt>Target status</dt>
          <dd>{statusLabel(metric.statusAgainstTarget)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">{metric.trendDescription}</p>
      <p className="mt-auto pt-3 text-xs">
        <Link
          href={`/accountability/methodology/${metric.methodologyPublicCode}`}
          className="font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Methodology
        </Link>
        <span className="text-muted-foreground">
          {" "}
          ·{" "}
          {new Date(metric.reportingPeriodStart).toLocaleDateString("en-AU")} –{" "}
          {new Date(metric.reportingPeriodEnd).toLocaleDateString("en-AU")}
        </span>
      </p>
    </article>
  );
}
