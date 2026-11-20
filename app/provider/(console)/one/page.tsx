import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";
import { isMapAbleOneOperationsHubEnabled } from "@/lib/config/mapable-one";
import {
  oneCapabilitiesByDomain,
  oneCapabilitySummary,
  type OneOperationalDomain,
} from "@/lib/one/operations-registry";
import { getProviderControlPanelSummaryForUser } from "@/lib/provider/provider-control-panel-service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "MapAble One | Provider operations overview",
  robots: { index: false, follow: false },
};

const DOMAIN_TITLES: Record<OneOperationalDomain, string> = {
  workforce: "People and shifts",
  practice: "Rehabilitation practice",
  employment: "Employment and work",
  finance: "Bookings and finance",
};

const DOMAIN_COPY: Record<OneOperationalDomain, string> = {
  workforce:
    "Deputy-style rostering, availability and service continuity, without introducing a separate workforce database.",
  practice:
    "Splose-style booking and practice coordination while keeping clinical plans under separate clinician permissions.",
  employment:
    "Employment services, employer job postings and participant-approved work support.",
  finance:
    "Shared service evidence and provider-owned billing, progressing towards a native accounting ledger.",
};

const STAGE: Record<string, string> = {
  existing_gated: "Existing code · not a live-service claim",
  directory_preview: "Directory preview",
  planned: "Planned · no operational workflow",
};

export default async function ProviderOnePage() {
  const user = await requirePermission("care:read:org");
  if (!isMapAbleOneOperationsHubEnabled()) notFound();

  const summary = await getProviderControlPanelSummaryForUser(user);
  const primary = summary.primaryOrganisation;
  const stages = oneCapabilitySummary();
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header className="rounded-3xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-orange-50 p-6 dark:border-violet-800 dark:from-violet-950/30 dark:via-background dark:to-orange-950/20">
        <p className="text-sm font-bold uppercase tracking-wider text-violet-800 dark:text-violet-200">
          MapAble One · Provider operations preview
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground">
          One place to coordinate services
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          Connect workforce scheduling, rehabilitation practice, employment,
          bookings and billing without transferring clinical or applicant records
          into the public marketplaces. Existing workflows retain authority.
        </p>
        <p role="note" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
          Read-only integration preview. This screen does not assign workers,
          book consultations, submit applications, approve clinical plans,
          create invoices, run payroll or accept payments.
        </p>
      </header>

      {primary ? (
        <section aria-labelledby="org-summary" className="space-y-3">
          <h2 id="org-summary" className="font-heading text-xl font-bold">
            {primary.organisationName} · Existing Care operations
          </h2>
          <p className="text-sm text-muted-foreground">
            This is a provider dashboard summary, not workforce screening or proof of service readiness.
            The clinical and employment modules keep separate access controls.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Upcoming scheduled shifts (7 days)", value: primary.upcomingShifts7d },
              { label: "Unallocated shifts (72 hours)", value: primary.unassignedShifts72h },
              { label: "Open Care requests", value: primary.openCareRequests },
            ].map((metric) => (
              <div key={metric.label} className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">{metric.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p role="status" className="rounded-xl border border-border p-4 text-sm">
          No linked provider organisation was found. Ask an authorised administrator
          to complete your organisation membership before reviewing its operations.
        </p>
      )}

      <section aria-labelledby="capabilities-heading" className="space-y-4">
        <div>
          <h2 id="capabilities-heading" className="font-heading text-2xl font-bold">
            Native operating capabilities
          </h2>
          <p className="text-sm text-muted-foreground">
            {stages.existing} existing-code capabilities, {stages.preview} directory previews,
            and {stages.planned} planned workflows. Code presence does not establish production readiness.
          </p>
        </div>
        {(Object.keys(DOMAIN_TITLES) as OneOperationalDomain[]).map((domain) => (
          <section key={domain} aria-labelledby={"one-" + domain} className="space-y-3">
            <div>
              <h3 id={"one-" + domain} className="text-xl font-bold">
                {DOMAIN_TITLES[domain]}
              </h3>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                {DOMAIN_COPY[domain]}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {oneCapabilitiesByDomain(domain).map((capability) => (
                <li key={capability.id} className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {STAGE[capability.stage]}
                  </p>
                  <h4 className="mt-2 font-semibold text-foreground">{capability.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {capability.description}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{capability.caution}</p>
                  {capability.existingRoute ? (
                    <Link
                      className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border px-4 font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      href={capability.existingRoute}
                    >
                      {capability.stage === "directory_preview"
                        ? "Explore directory"
                        : "Open existing workflow"}
                    </Link>
                  ) : (
                    <p className="mt-4 text-xs font-semibold">Not enabled for real operations</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>

      <aside className="space-y-2 rounded-xl border border-border bg-card p-5" aria-label="MapAble One authority">
        <h2 className="text-lg font-bold">One system, separate responsibilities</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Each source domain owns its records. A planned appointment, staff roster,
          approved service record and invoice are different events; none automatically
          authorises another. Human reviewers retain authority over clinical,
          employment-disclosure, safeguarding, payroll and payment decisions.
        </p>
        <nav aria-label="Related operational journeys" className="flex flex-wrap gap-3">
          <Link href="/employment/directory" className="min-h-11 rounded-lg border border-border px-4 py-3 text-sm font-semibold underline">Employment directory</Link>
          <Link href="/moves/directory" className="min-h-11 rounded-lg border border-border px-4 py-3 text-sm font-semibold underline">Rehabilitation directory</Link>
          <Link href="/provider" className="min-h-11 rounded-lg border border-border px-4 py-3 text-sm font-semibold underline">Provider control panel</Link>
        </nav>
      </aside>
    </main>
  );
}
