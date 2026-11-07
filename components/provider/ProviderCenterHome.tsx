import type { MapAbleUserRole } from "@prisma/client";
import Link from "next/link";

import { CoreHubCard } from "@/components/core/CoreHubCard";
import { roleLabel } from "@/lib/auth/roles";
import { getProviderCenterHref } from "@/lib/platform/core-ui/provider-center-nav";
import type { UserRole } from "@/types/mapable";

type OrgSummary = {
  organisationName: string;
  onboardingReady: boolean;
  onboardingBlockerCount: number;
  serviceReady: boolean;
  serviceReadyBlockerCount: number;
  activeWorkers: number;
  pendingVerificationWorkers: number;
  pendingInvites: number;
  assignedBookings: number;
  openCareRequests: number;
  upcomingShifts7d: number;
  unassignedShifts72h: number;
};

type EnterpriseSummary = {
  careShifts?: number;
  openRecoveries?: number;
  openReconciliationExceptions?: number;
  rosterGaps?: number;
};

function MetricTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  );
}

export function ProviderCenterHome({
  primaryRole,
  primary,
  enterprise,
  onBusinessHost,
}: {
  primaryRole: UserRole | MapAbleUserRole;
  primary: OrgSummary | null;
  enterprise: EnterpriseSummary | null;
  onBusinessHost: boolean;
}) {
  const href = (subpath: string) =>
    getProviderCenterHref(subpath, onBusinessHost);

  const showOnboardingAlert =
    primary && !primary.onboardingReady && primary.onboardingBlockerCount > 0;

  const attentionItems: { label: string; href: string; count: number }[] = [];
  if (primary) {
    if (primary.onboardingBlockerCount > 0) {
      attentionItems.push({
        label: "Onboarding blockers",
        href: href("/onboarding"),
        count: primary.onboardingBlockerCount,
      });
    }
    if (primary.unassignedShifts72h > 0) {
      attentionItems.push({
        label: "Roster gaps (72h)",
        href: href("/care/roster"),
        count: primary.unassignedShifts72h,
      });
    }
    if (primary.openCareRequests > 0) {
      attentionItems.push({
        label: "Open care requests",
        href: href("/care/requests"),
        count: primary.openCareRequests,
      });
    }
    if (primary.pendingInvites > 0) {
      attentionItems.push({
        label: "Pending worker invites",
        href: href("/workers"),
        count: primary.pendingInvites,
      });
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#005B7F]">
          Provider Center
        </p>
        <h1 className="font-heading mt-1 text-3xl font-bold">Home</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Signed in as <strong>{roleLabel(primaryRole)}</strong>
          {primary ? (
            <>
              {" "}
              for <strong>{primary.organisationName}</strong>
            </>
          ) : (
            ". Link your account to an organisation to see metrics."
          )}
        </p>
      </header>

      {primary ? (
        <div
          className={
            primary.serviceReady
              ? "rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3"
              : "rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3"
          }
          role="status"
        >
          <p className="font-medium">
            {primary.serviceReady
              ? "Service-ready — you can receive care assignments"
              : `Not service-ready — ${primary.serviceReadyBlockerCount} blocker${
                  primary.serviceReadyBlockerCount === 1 ? "" : "s"
                } remaining`}
          </p>
          {!primary.serviceReady ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Complete verification, onboarding, and verify at least one active
              worker before MapAble assigns care requests to your organisation.
            </p>
          ) : null}
          <Link
            href={href("/onboarding")}
            className="mt-2 inline-block text-sm font-semibold text-primary underline"
          >
            {primary.serviceReady ? "Review readiness" : "Fix blockers"} →
          </Link>
        </div>
      ) : null}

      {showOnboardingAlert && primary ? (
        <div
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3"
          role="alert"
        >
          <p className="font-medium text-amber-950 dark:text-amber-100">
            Onboarding incomplete — {primary.onboardingBlockerCount} blocker
            {primary.onboardingBlockerCount === 1 ? "" : "s"} remaining
          </p>
          <Link
            href={href("/onboarding")}
            className="mt-2 inline-block text-sm font-semibold text-primary underline"
          >
            Continue onboarding →
          </Link>
        </div>
      ) : null}

      {attentionItems.length > 0 ? (
        <section aria-label="Needs attention">
          <h2 className="mb-4 text-lg font-semibold">Needs attention</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {attentionItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40"
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
                    {item.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {primary ? (
        <section aria-label="Organisation metrics">
          <h2 className="mb-4 text-lg font-semibold">At a glance</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricTile
              label="Active workers"
              value={primary.activeWorkers}
              detail={
                primary.pendingVerificationWorkers
                  ? `${primary.pendingVerificationWorkers} pending verification`
                  : undefined
              }
            />
            <MetricTile label="Pending invites" value={primary.pendingInvites} />
            <MetricTile
              label="Assigned bookings"
              value={primary.assignedBookings}
            />
            <MetricTile
              label="Open care requests"
              value={primary.openCareRequests}
            />
            <MetricTile
              label="Upcoming shifts (7d)"
              value={primary.upcomingShifts7d}
            />
            <MetricTile
              label="Roster gaps (72h)"
              value={primary.unassignedShifts72h}
              detail={
                primary.unassignedShifts72h
                  ? "Unassigned shifts starting soon"
                  : undefined
              }
            />
          </div>
        </section>
      ) : null}

      {enterprise && "openRecoveries" in enterprise ? (
        <section
          id="enterprise-workspace"
          aria-label="Enterprise metrics"
          className="scroll-mt-8"
        >
          <h2 className="mb-4 text-lg font-semibold">Enterprise workspace</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile label="Care shifts" value={enterprise.careShifts ?? 0} />
            <MetricTile
              label="Open recoveries"
              value={enterprise.openRecoveries ?? 0}
            />
            <MetricTile
              label="Recon exceptions"
              value={enterprise.openReconciliationExceptions ?? 0}
            />
            <MetricTile
              label="Roster gaps (72h)"
              value={enterprise.rosterGaps ?? 0}
            />
          </div>
        </section>
      ) : null}

      <section aria-label="Workspace">
        <h2 className="mb-4 text-lg font-semibold">Workspace</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CoreHubCard
            title="Workforce"
            description={
              primary
                ? `${primary.activeWorkers} active · ${primary.pendingInvites} pending invite(s)`
                : "Manage your support worker roster"
            }
            href={href("/workers")}
          />
          <CoreHubCard
            title="Care inbox"
            description={
              primary?.openCareRequests
                ? `${primary.openCareRequests} open request(s)`
                : "Review assigned care requests"
            }
            href={href("/care/requests")}
          />
          <CoreHubCard
            title="Roster"
            description={
              primary?.unassignedShifts72h
                ? `${primary.unassignedShifts72h} gap(s) in the next 72 hours`
                : "View and manage care roster"
            }
            href={href("/care/roster")}
          />
          <CoreHubCard
            title="Bookings"
            description={
              primary?.assignedBookings
                ? `${primary.assignedBookings} assigned booking(s)`
                : "Provider booking requests"
            }
            href={href("/bookings")}
          />
          <CoreHubCard
            title="Money"
            description="Billing, payouts and invoices"
            href={href("/billing")}
          />
          <CoreHubCard
            title="Claiming"
            description="NDIS plan-managed and NDIA direct claiming"
            href={href("/claiming")}
          />
          <CoreHubCard
            title="Calendar"
            description="Shifts, availability and scheduled care"
            href={href("/calendar")}
          />
          <CoreHubCard
            title="Insights"
            description="Benchmarks, reports and capacity"
            href={href("/insights")}
          />
        </div>
      </section>
    </div>
  );
}
