import Link from "next/link";

import { AccountabilityMetricCard } from "@/components/accountability/AccountabilityMetricCard";
import { AccountabilityStatusBanner } from "@/components/accountability/AccountabilityStatusBanner";
import { DemonstrationBanner } from "@/components/accountability/DemonstrationBanner";
import { DomainBrowseCards } from "@/components/accountability/DomainBrowseCards";
import { ExplainThisPage } from "@/components/accountability/ExplainThisPage";
import { PublicNoticeList } from "@/components/accountability/PublicNoticeBanner";
import {
  getPortalStatus,
  listActivePublicNotices,
  listPublishedHeadlineMetrics,
  listPublicAccountabilityImprovements,
} from "@/lib/accountability/portal-home";
import {
  getAccountabilityDisclaimer,
  listPublicAccountabilityReports,
} from "@/lib/national-accountability/accountability-service";

export default async function AccountabilityPortalHomePage() {
  const [status, metrics, notices, improvements, legacyReports] =
    await Promise.all([
      getPortalStatus(),
      listPublishedHeadlineMetrics(),
      listActivePublicNotices(),
      listPublicAccountabilityImprovements(),
      listPublicAccountabilityReports(),
    ]);

  const showDemo =
    status.isDemonstration || metrics.some((m) => m.isDemonstration);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          MapAble Public Accountability Portal
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Evidence-backed reporting on service reliability, safeguarding,
          accessibility, governance, AI use and public commitments. This is not a
          marketing dashboard — every material claim links to methodology and a
          publication snapshot.
        </p>
        <p className="text-xs text-muted-foreground">
          {getAccountabilityDisclaimer()}
        </p>
      </header>

      <DemonstrationBanner show={showDemo} />

      <ExplainThisPage summary="This page shows the latest approved public reporting period, a small set of headline indicators with methodology links, current notices, and ways to browse accountability domains. Values come only from published snapshots, never from live operational databases." />

      <AccountabilityStatusBanner status={status} />

      <section aria-labelledby="headline-indicators-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="headline-indicators-heading" className="font-heading text-2xl font-semibold">
            Headline indicators
          </h2>
          <Link
            href="/accountability/methodology"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            View methodologies
          </Link>
        </div>
        {metrics.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No published headline indicators yet. Check back after the next
            approved publication.
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <li key={metric.publicCode}>
                <AccountabilityMetricCard metric={metric} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="notices-heading" className="space-y-4">
        <h2 id="notices-heading" className="font-heading text-2xl font-semibold">
          Current accountability notices
        </h2>
        <PublicNoticeList notices={notices} />
      </section>

      <section aria-labelledby="domains-heading" className="space-y-4">
        <h2 id="domains-heading" className="font-heading text-2xl font-semibold">
          Browse by accountability domain
        </h2>
        <DomainBrowseCards />
      </section>

      <section aria-labelledby="spoke-up-heading" className="space-y-4">
        <h2 id="spoke-up-heading" className="font-heading text-2xl font-semibold">
          What changed because people spoke up?
        </h2>
        <p className="text-sm text-muted-foreground">
          Privacy-safe examples of improvements from feedback, complaints,
          incident reviews and accessibility reports. Identifying details are never
          published without explicit, recorded consent.
        </p>
        {improvements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No published improvement examples in the current snapshot.
          </p>
        ) : (
          <ul className="space-y-3">
            {improvements.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <h3 className="font-heading font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm">{item.summary}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Source: {item.sourceLabel}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {legacyReports.length > 0 ? (
        <section aria-labelledby="legacy-reports-heading" className="space-y-3">
          <h2 id="legacy-reports-heading" className="font-heading text-xl font-semibold">
            Earlier national accountability reports
          </h2>
          <ul className="space-y-3">
            {legacyReports.map((r) => (
              <li key={r.id} className="rounded-lg border border-slate-200 p-4">
                <h3 className="font-semibold">{r.title}</h3>
                <p className="text-sm">{r.summary}</p>
                <p className="text-xs text-muted-foreground">
                  {r.category} — {r.periodLabel}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav aria-label="Accountability actions" className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/accountability/submit"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 py-2 font-medium text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
        >
          Challenge a publication
        </Link>
        <Link
          href="/accountability/subscribe"
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
        >
          Subscribe to updates
        </Link>
        <Link
          href="/accountability/corrections"
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
        >
          View corrections
        </Link>
      </nav>
    </div>
  );
}
