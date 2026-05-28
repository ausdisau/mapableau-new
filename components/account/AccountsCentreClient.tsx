"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AccountSectionCard } from "@/components/account/AccountSectionCard";
import { NotificationSettingsForm } from "@/components/notifications/NotificationSettingsForm";
import { StripeCheckoutStatusBanner } from "@/components/billing/StripeCheckoutStatusBanner";
import { Badge } from "@/components/ui/badge";
import { roleLabel } from "@/lib/auth/roles";
import type { AccountSummary } from "@/lib/account/account-summary-types";
import type { UserRole } from "@/types/mapable";

export function AccountsCentreClient({
  initialNotificationPrefs,
}: {
  initialNotificationPrefs: { category: string; channel: string; enabled: boolean }[];
}) {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/summary")
      .then(async (r) => {
        if (!r.ok) {
          const body = (await r.json()) as { error?: string };
          throw new Error(body.error ?? "Could not load account summary");
        }
        return r.json() as Promise<AccountSummary>;
      })
      .then(setSummary)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (!summary) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Loading your account…
      </p>
    );
  }

  const { sections, user, persona } = summary;
  const billingHref =
    persona === "provider" ? "/provider/billing" : "/dashboard/billing";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="outline">Accounts centre</Badge>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Your account
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Signed in as {user.name} ({user.email}). Role:{" "}
          <strong>{roleLabel(user.primaryRole as UserRole)}</strong>
          {user.roles.length > 1 ? (
            <> · Also: {user.roles.filter((r) => r !== user.primaryRole).map((r) => roleLabel(r as UserRole)).join(", ")}</>
          ) : null}
        </p>
        {summary.notificationSummary.unreadCount > 0 ? (
          <p className="text-sm">
            <Link href="/dashboard/notifications" className="text-primary hover:underline">
              {summary.notificationSummary.unreadCount} unread notification
              {summary.notificationSummary.unreadCount === 1 ? "" : "s"}
            </Link>
          </p>
        ) : null}
      </header>

      {sections.billing ? <StripeCheckoutStatusBanner showSubscriptionHint /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {sections.identity ? (
          <AccountSectionCard
            title="Identity & contact"
            description="How MapAble reaches you and your display name."
            href={
              sections.profile && persona === "participant"
                ? "/dashboard/profile/edit"
                : undefined
            }
            hrefLabel="Edit profile"
          >
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">Name</dt>
                <dd>{user.name}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Email</dt>
                <dd>{user.email}</dd>
              </div>
              {user.phone ? (
                <div>
                  <dt className="font-medium text-muted-foreground">Phone</dt>
                  <dd>{user.phone}</dd>
                </div>
              ) : null}
              <div>
                <dt className="font-medium text-muted-foreground">Timezone</dt>
                <dd>{user.timezone}</dd>
              </div>
            </dl>
          </AccountSectionCard>
        ) : null}

        {sections.profile && summary.participantProfile ? (
          <AccountSectionCard
            title="Participant profile"
            description="Your support and NDIS-related profile details."
            href="/dashboard/profile"
            hrefLabel="View profile"
          >
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">Display name</dt>
                <dd>{summary.participantProfile.displayName}</dd>
              </div>
              {summary.participantProfile.preferredName ? (
                <div>
                  <dt className="font-medium text-muted-foreground">Preferred name</dt>
                  <dd>{summary.participantProfile.preferredName}</dd>
                </div>
              ) : null}
              {summary.participantProfile.hasNdisNumber ? (
                <div>
                  <dt className="font-medium text-muted-foreground">NDIS number</dt>
                  <dd>
                    {summary.participantProfile.ndisParticipantNumberMasked ??
                      "On file (masked)"}
                  </dd>
                </div>
              ) : null}
            </dl>
          </AccountSectionCard>
        ) : null}

        {sections.workerProfile && summary.workerProfile ? (
          <AccountSectionCard
            title="Worker profile"
            description="Credentials and verification with your organisation."
          >
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">Display name</dt>
                <dd>{summary.workerProfile.displayName}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Organisation</dt>
                <dd>{summary.workerProfile.organisationName}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Verification</dt>
                <dd className="capitalize">
                  {summary.workerProfile.verificationStatus.replace(/_/g, " ")}
                </dd>
              </div>
            </dl>
          </AccountSectionCard>
        ) : null}

        {sections.organisation && summary.organisations.length > 0 ? (
          <AccountSectionCard
            title="Organisations"
            description="Teams and providers linked to your account."
            href={persona === "provider" ? "/provider/onboarding" : "/enterprise-provider"}
            hrefLabel={persona === "provider" ? "Provider console" : "Enterprise"}
          >
            <ul className="space-y-2 text-sm">
              {summary.organisations.map((org) => (
                <li key={org.id} className="rounded-lg border border-border px-3 py-2">
                  <span className="font-medium">{org.name}</span>
                  <span className="ml-2 text-muted-foreground">
                    ({roleLabel(org.role as UserRole)})
                  </span>
                </li>
              ))}
            </ul>
          </AccountSectionCard>
        ) : null}

        {sections.billing ? (
          <AccountSectionCard
            title="Billing & payments"
            description={
              persona === "provider"
                ? "Stripe Connect payouts and provider subscriptions."
                : "Invoices, funding sources, and card checkout."
            }
            href={billingHref}
            hrefLabel="Open billing"
          >
            {summary.billingAccounts.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {summary.billingAccounts.map((ba) => (
                  <li key={ba.role} className="rounded-lg border border-border px-3 py-2">
                    <span className="font-medium capitalize">{ba.role}</span>
                    {ba.stripeConnectedAccountId ? (
                      <p className="text-muted-foreground">
                        Connect:{" "}
                        {ba.connectOnboardingComplete ? "onboarding complete" : "onboarding pending"}
                      </p>
                    ) : null}
                    {ba.stripeCustomerId ? (
                      <p className="text-muted-foreground">Stripe customer linked</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No billing account record yet. Open billing to set up payments.
              </p>
            )}
          </AccountSectionCard>
        ) : null}

        {sections.accessibility ? (
          <AccountSectionCard
            title="Accessibility"
            description="Mobility, communication, and access needs."
            href="/dashboard/accessibility"
            hrefLabel="Manage accessibility"
          />
        ) : null}

        {sections.consent ? (
          <AccountSectionCard
            title="Consent & sharing"
            description="Who can see your information and for what purpose."
            href="/dashboard/consent"
            hrefLabel="Manage consent"
          />
        ) : null}

        {sections.portals ? (
          <AccountSectionCard title="Work portals" description="Shortcuts to your day-to-day tools.">
            <ul className="flex flex-wrap gap-2 text-sm">
              {persona === "provider" ? (
                <>
                  <li>
                    <Link href="/provider/bookings" className="text-primary hover:underline">
                      Provider bookings
                    </Link>
                  </li>
                  <li>
                    <Link href="/provider/care" className="text-primary hover:underline">
                      Care console
                    </Link>
                  </li>
                </>
              ) : null}
              {persona === "worker" || sections.workerProfile ? (
                <>
                  <li>
                    <Link href="/worker/today" className="text-primary hover:underline">
                      Today
                    </Link>
                  </li>
                  <li>
                    <Link href="/worker/service-log" className="text-primary hover:underline">
                      Service log
                    </Link>
                  </li>
                </>
              ) : null}
            </ul>
          </AccountSectionCard>
        ) : null}

        {sections.security ? (
          <AccountSectionCard
            title="Security"
            description="Password and sign-in are managed through the login page. Multi-factor and password change will be added in a future update."
          >
            <p className="text-sm text-muted-foreground">
              To sign out on this device, use Sign out in the navigation bar.
            </p>
          </AccountSectionCard>
        ) : null}
      </div>

      {sections.notifications ? (
        <AccountSectionCard
          title="Notification preferences"
          description="Choose how MapAble contacts you by category and channel."
        >
          <NotificationSettingsForm initial={initialNotificationPrefs} />
        </AccountSectionCard>
      ) : null}
    </div>
  );
}
