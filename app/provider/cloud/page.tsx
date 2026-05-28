import Link from "next/link";

import { CoreHubCard } from "@/components/core/CoreHubCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdminRole } from "@/lib/auth/roles";
import { requirePermission } from "@/lib/auth/guards";
import {
  mapableEyebrowBadgeClass,
  mapableSectionCardClass,
} from "@/lib/brand/styles";
import {
  formatSubscriptionPlanLabel,
  formatSubscriptionStatusLabel,
  getProviderCloudContext,
} from "@/lib/providers/provider-cloud-context";

export const metadata = {
  title: "Provider Cloud | MapAble",
  description:
    "Organisation-scoped control plane for NDIS care providers on MapAble.",
};

const QUICK_LINKS = [
  {
    href: "/provider/care",
    title: "Care operations",
    description: "Requests, roster, shifts, and service logs for your organisation.",
  },
  {
    href: "/provider/workers",
    title: "Team & workers",
    description: "Worker profiles, qualifications, and capacity linked to your org.",
  },
  {
    href: "/provider/transport",
    title: "Transport",
    description: "Trips, vehicles, drivers, and dispatch for accessible transport.",
  },
  {
    href: "/provider/billing",
    title: "Billing & payouts",
    description: "Stripe Connect payouts and Provider Pro subscription.",
  },
  {
    href: "/provider/onboarding",
    title: "Onboarding",
    description: "Complete verification and setup tasks for your provider profile.",
  },
  {
    href: "/provider/support",
    title: "Support",
    description: "Get help with integrations, claiming, and platform configuration.",
  },
] as const;

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className={mapableSectionCardClass + " p-4"}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default async function ProviderCloudPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const user = await requirePermission("care:read:org");
  const { org: orgParam } = await searchParams;
  const ctx = await getProviderCloudContext(user.id, {
    organisationId: orgParam,
    isPlatformAdmin: isAdminRole(user.primaryRole),
  });

  const primaryOrg = ctx.organisations.find((o) => o.id === ctx.primaryOrganisationId);
  const hasMultipleOrgs = ctx.organisations.length > 1;

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <Badge variant="outline" className={mapableEyebrowBadgeClass}>
          Provider Cloud
        </Badge>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Your organisation <span className="text-primary">control plane</span>
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          A single place to see plan status, team scale, care workload, and shortcuts into
          MapAble&apos;s provider console — scoped to your NDIS organisation, not the public
          marketplace listing alone.
        </p>
      </header>

      {!primaryOrg ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No organisation linked</CardTitle>
            <CardDescription>
              Ask your organisation administrator to invite you, or complete provider
              onboarding to create your tenant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/provider/onboarding"
              className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
            >
              Start provider onboarding
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <section aria-labelledby="org-context-heading" className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 id="org-context-heading" className="font-heading text-xl font-semibold">
                  {primaryOrg.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your role: {primaryOrg.memberRole.replace(/_/g, " ")}
                  {primaryOrg.ndisRegistrationClaimed ? " · NDIS registration on file" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{primaryOrg.status}</Badge>
                <Badge variant="outline">Verification: {primaryOrg.verificationStatus}</Badge>
              </div>
            </div>

            {hasMultipleOrgs ? (
              <nav aria-label="Switch organisation" className="flex flex-wrap gap-2">
                {ctx.organisations.map((org) => (
                  <Link
                    key={org.id}
                    href={org.id === ctx.primaryOrganisationId ? "/provider/cloud" : `/provider/cloud?org=${org.id}`}
                    className={
                      org.id === ctx.primaryOrganisationId
                        ? "rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                        : "rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                    }
                    aria-current={org.id === ctx.primaryOrganisationId ? "page" : undefined}
                  >
                    {org.name}
                  </Link>
                ))}
              </nav>
            ) : null}

            {primaryOrg.linkedProviderName ? (
              <p className="text-sm text-muted-foreground">
                Public provider profile:{" "}
                <Link
                  href={`/provider/${primaryOrg.linkedProviderId}`}
                  className="text-primary underline"
                >
                  {primaryOrg.linkedProviderName}
                </Link>
              </p>
            ) : null}
          </section>

          {ctx.metrics ? (
            <section aria-labelledby="metrics-heading">
              <h2 id="metrics-heading" className="sr-only">
                Organisation metrics
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricTile label="Team members" value={ctx.metrics.teamMemberCount} />
                <MetricTile label="Active workers" value={ctx.metrics.activeWorkerCount} />
                <MetricTile
                  label="Open care requests"
                  value={ctx.metrics.openCareRequestCount}
                />
                <MetricTile
                  label="Upcoming shifts"
                  value={ctx.metrics.upcomingShiftCount}
                  hint="Scheduled or confirmed"
                />
              </div>
            </section>
          ) : null}

          <section
            aria-labelledby="plan-heading"
            className="grid gap-4 lg:grid-cols-2"
          >
            <Card variant="gradient">
              <CardHeader>
                <CardTitle id="plan-heading" className="font-heading text-xl">
                  SaaS plan &amp; billing
                </CardTitle>
                <CardDescription>
                  {ctx.subscription.label}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {ctx.subscription.tenancyNote}
                </p>
                <dl className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Plan</dt>
                    <dd className="font-medium">
                      {formatSubscriptionPlanLabel(ctx.subscription.planCode)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="font-medium">
                      {formatSubscriptionStatusLabel(ctx.subscription.status)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Stripe payouts</dt>
                    <dd className="font-medium">
                      {ctx.subscription.connectOnboardingComplete
                        ? "Onboarding complete"
                        : "Setup required"}
                    </dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/provider/billing"
                    className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {ctx.subscription.status === "active" ? "Manage billing" : "Upgrade to Provider Pro"}
                  </Link>
                  <Link
                    href="/core"
                    className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    MapAble Core hub
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">Onboarding &amp; integrations</CardTitle>
                <CardDescription>
                  {ctx.metrics?.onboardingStatus
                    ? `Workflow: ${ctx.metrics.onboardingStatus.replace(/_/g, " ")}`
                    : "No active onboarding workflow"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ctx.metrics && ctx.metrics.onboardingPendingTasks > 0 ? (
                  <p className="text-sm">
                    <span className="font-semibold tabular-nums">
                      {ctx.metrics.onboardingPendingTasks}
                    </span>{" "}
                    setup task
                    {ctx.metrics.onboardingPendingTasks === 1 ? "" : "s"} still open.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Platform connectors run at the MapAble tenant level. Status below is read-only;
                    request changes via support unless you are a platform administrator.
                  </p>
                )}
                {ctx.integrations.length > 0 ? (
                  <ul className="space-y-2 text-sm" aria-label="Platform integration status">
                    {ctx.integrations.map((integration) => (
                      <li
                        key={integration.key}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                      >
                        <span className="font-medium">{integration.displayName}</span>
                        <span className="text-muted-foreground">{integration.healthLabel}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/provider/onboarding"
                    className="text-sm font-semibold text-primary underline"
                  >
                    Provider onboarding
                  </Link>
                  <Link
                    href="/provider/support"
                    className="text-sm font-semibold text-primary underline"
                  >
                    Request integration help
                  </Link>
                  {ctx.isPlatformAdmin ? (
                    <Link
                      href="/admin/integrations"
                      className="text-sm font-semibold text-primary underline"
                    >
                      Integration health (admin)
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}

      <section aria-labelledby="quick-links-heading">
        <h2 id="quick-links-heading" className="font-heading text-xl font-semibold">
          Provider console
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((link) => (
            <CoreHubCard
              key={link.href}
              href={link.href}
              title={link.title}
              description={link.description}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
