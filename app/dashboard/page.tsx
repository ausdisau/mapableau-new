import Link from "next/link";

import { adaptParticipantDashboard } from "@/lib/access/adaptive";
import { requireAuth } from "@/lib/auth/guards";
import { roleLabel } from "@/lib/auth/roles";
import { caseListWhereForUser } from "@/lib/cases/case-access";
import { caseManagementConfig } from "@/lib/config/case-management";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { countOpenSubmissions } from "@/lib/engagement/engagement-submission-service";
import { listConversationsForUser } from "@/lib/messages/message-service";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Home | MapAble Core" };

const linkClass =
  "inline-flex min-h-11 items-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const primaryLinkClass =
  "inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function formatWhen(date: Date) {
  return date.toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const now = new Date();

  const [
    profile,
    accessibilityProfile,
    upcomingTrips,
    upcomingCare,
    unreadNotifications,
    openSupportCount,
    openCaseCount,
    openEngagementCount,
    conversations,
    activeConsentCount,
  ] = await Promise.all([
    prisma.participantProfile.findUnique({ where: { userId: user.id } }),
    prisma.accessibilityProfile.findUnique({ where: { userId: user.id } }),
    prisma.transportTrip.findMany({
      where: {
        participantId: user.id,
        scheduledStart: { gte: now },
        status: { notIn: ["cancelled", "declined", "closed", "trip_completed"] },
      },
      orderBy: { scheduledStart: "asc" },
      take: 5,
      select: {
        id: true,
        status: true,
        scheduledStart: true,
        pickupSuburb: true,
        dropoffSuburb: true,
        pickupAddress: true,
        dropoffAddress: true,
      },
    }),
    prisma.careBooking.findMany({
      where: {
        participantId: user.id,
        status: {
          notIn: ["cancelled", "declined", "completed"],
        },
        OR: [
          { scheduledStartAt: { gte: now } },
          { scheduledStartAt: null },
        ],
      },
      orderBy: { scheduledStartAt: "asc" },
      take: 5,
      select: {
        id: true,
        status: true,
        scheduledStartAt: true,
        location: true,
        organisation: { select: { name: true } },
      },
    }),
    prisma.notification.count({
      where: { userId: user.id, readAt: null },
    }),
    prisma.supportTicket.count({
      where: {
        OR: [{ createdById: user.id }, { participantId: user.id }],
        status: { notIn: ["resolved", "closed"] },
      },
    }),
    caseManagementConfig.enabled
      ? prisma.case.count({
          where: {
            AND: [
              caseListWhereForUser(user.id, user.primaryRole),
              { status: { not: "closed" } },
            ],
          },
        })
      : Promise.resolve(0),
    isEngagementPlatformEnabled()
      ? countOpenSubmissions(user.id)
      : Promise.resolve(0),
    listConversationsForUser(user.id, false).then((rows) => rows.slice(0, 3)),
    prisma.consentRecord.count({
      where: { subjectUserId: user.id, status: "active" },
    }),
  ]);

  const mobility = (accessibilityProfile?.mobilityNeeds as string[]) ?? [];
  const communication =
    (accessibilityProfile?.communicationPreferences as string[]) ?? [];

  type ActionItem = {
    id: string;
    title: string;
    detail: string;
    href: string;
    priority: "high" | "normal";
  };

  const actions: ActionItem[] = [];

  if (!profile) {
    actions.push({
      id: "profile",
      title: "Set up your participant profile",
      detail: "Add a display name so care and transport can recognise you.",
      href: "/dashboard/profile",
      priority: "high",
    });
  }

  if (!accessibilityProfile || mobility.length === 0) {
    actions.push({
      id: "a11y",
      title: "Review accessibility preferences",
      detail: "Tell MapAble how you move, communicate, and travel.",
      href: "/dashboard/accessibility/edit",
      priority: "high",
    });
  }

  if (unreadNotifications > 0) {
    actions.push({
      id: "notifications",
      title: `Read ${unreadNotifications} unread notification${unreadNotifications === 1 ? "" : "s"}`,
      detail: "Status updates and requests waiting for you.",
      href: "/dashboard/notifications",
      priority: "high",
    });
  }

  if (openSupportCount > 0) {
    actions.push({
      id: "support",
      title: `Follow up ${openSupportCount} open support ticket${openSupportCount === 1 ? "" : "s"}`,
      detail: "Tickets that are not yet resolved or closed.",
      href: "/dashboard/safety",
      priority: "normal",
    });
  }

  if (upcomingTrips.some((t) => t.status === "participant_review")) {
    actions.push({
      id: "trip-review",
      title: "Confirm or dispute a completed trip",
      detail: "A transport trip is waiting for your review.",
      href: "/dashboard/transport",
      priority: "high",
    });
  }

  if (isEngagementPlatformEnabled() && openEngagementCount > 0) {
    actions.push({
      id: "engagement",
      title: `Respond to ${openEngagementCount} feedback item${openEngagementCount === 1 ? "" : "s"}`,
      detail: "Open feedback or complaint submissions.",
      href: "/dashboard/engagement",
      priority: "normal",
    });
  }

  if (caseManagementConfig.enabled && openCaseCount > 0) {
    actions.push({
      id: "cases",
      title: `Review ${openCaseCount} open case${openCaseCount === 1 ? "" : "s"}`,
      detail: "Case insights are advisory only — you decide next steps.",
      href: "/dashboard/cases",
      priority: "normal",
    });
  }

  if (activeConsentCount === 0) {
    actions.push({
      id: "consent",
      title: "Check who can see your information",
      detail: "No active sharing grants yet. Review consent when you share.",
      href: "/dashboard/consent",
      priority: "normal",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "all-clear",
      title: "Nothing urgent right now",
      detail: "You can still update preferences, trips, or messages below.",
      href: "/dashboard/accessibility",
      priority: "normal",
    });
  }

  // Presentation adapter only — flags default off; does not alter dashboard meaning.
  const presentation = adaptParticipantDashboard({ profile: null });
  const densityClass =
    presentation.applied &&
    presentation.policy?.informationDensity === "low"
      ? "mx-auto max-w-2xl space-y-10"
      : "mx-auto max-w-3xl space-y-10";

  return (
    <div
      className={densityClass}
      data-adapt-runtime={presentation.applied ? "on" : "off"}
      data-adapt-variant={presentation.policy?.componentVariant ?? "default"}
    >
      <header>
        <p className="text-sm text-muted-foreground">
          Signed in as {roleLabel(user.primaryRole)}
          {profile?.displayName ? ` · ${profile.displayName}` : ""}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold">
          What needs you today
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Next actions, upcoming trips and care, messages, and a short
          preference summary — one job per section.
        </p>
      </header>

      <section aria-labelledby="next-actions-heading" className="space-y-4">
        <h2 id="next-actions-heading" className="font-heading text-xl font-semibold">
          Next actions
        </h2>
        <ul className="space-y-3">
          {actions.map((action) => (
            <li
              key={action.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{action.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {action.detail}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Priority: {action.priority === "high" ? "needs you soon" : "when you can"}
                </p>
              </div>
              <Link
                href={action.href}
                className={
                  action.priority === "high" ? primaryLinkClass : linkClass
                }
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="upcoming-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="upcoming-heading" className="font-heading text-xl font-semibold">
            Upcoming trips and care
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/transport" className={linkClass}>
              All transport
            </Link>
            <Link href="/care/bookings" className={linkClass}>
              All care
            </Link>
          </div>
        </div>

        {upcomingTrips.length === 0 && upcomingCare.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming trips or care bookings scheduled.
          </p>
        ) : (
          <ul className="space-y-3" aria-label="Upcoming schedule">
            {upcomingTrips.map((trip) => (
              <li
                key={`trip-${trip.id}`}
                className="rounded-xl border border-border bg-card p-4"
              >
                <p className="font-medium">Transport trip</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatWhen(trip.scheduledStart)}
                </p>
                <p className="mt-1 text-sm">
                  {(trip.pickupSuburb || trip.pickupAddress) ?? "Pickup"}
                  {" → "}
                  {(trip.dropoffSuburb || trip.dropoffAddress) ?? "Drop-off"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Status: {statusLabel(trip.status)}
                </p>
                <Link
                  href={`/dashboard/transport`}
                  className={`${linkClass} mt-3`}
                >
                  View trip
                </Link>
              </li>
            ))}
            {upcomingCare.map((booking) => (
              <li
                key={`care-${booking.id}`}
                className="rounded-xl border border-border bg-card p-4"
              >
                <p className="font-medium">
                  Care · {booking.organisation.name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {booking.scheduledStartAt
                    ? formatWhen(booking.scheduledStartAt)
                    : "Schedule to be confirmed"}
                </p>
                {booking.location ? (
                  <p className="mt-1 text-sm">{booking.location}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  Status: {statusLabel(booking.status)}
                </p>
                <Link href="/care/bookings" className={`${linkClass} mt-3`}>
                  View care booking
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="messages-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="messages-heading" className="font-heading text-xl font-semibold">
            Messages
          </h2>
          <Link href="/dashboard/messages" className={linkClass}>
            Open messages
          </Link>
        </div>
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No conversations yet. Messages stay consent-scoped to people in each
            thread.
          </p>
        ) : (
          <ul className="space-y-3" aria-label="Recent conversations">
            {conversations.map((c) => {
              const others = c.participants
                .filter((p) => p.userId !== user.id)
                .map((p) => p.user.name)
                .filter(Boolean);
              return (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/messages/${c.id}`}
                    className="block rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <p className="font-medium">
                      {others.length ? others.join(", ") : "Conversation"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.lastMessageAt
                        ? `Last activity ${formatWhen(c.lastMessageAt)}`
                        : "No messages yet"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="preferences-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2
            id="preferences-heading"
            className="font-heading text-xl font-semibold"
          >
            Preference summary
          </h2>
          <Link href="/dashboard/accessibility" className={linkClass}>
            Manage preferences
          </Link>
        </div>
        <dl className="grid gap-4 rounded-xl border border-border bg-card p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium">Mobility</dt>
            <dd className="mt-1 text-muted-foreground">
              {mobility.length ? mobility.join(", ") : "Not set"}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Communication</dt>
            <dd className="mt-1 text-muted-foreground">
              {communication.length ? communication.join(", ") : "Not set"}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Active consent grants</dt>
            <dd className="mt-1 text-muted-foreground">
              {activeConsentCount} active
              {" · "}
              <Link
                href="/dashboard/consent"
                className="underline underline-offset-2"
              >
                Consent centre
              </Link>
            </dd>
          </div>
          <div>
            <dt className="font-medium">Unread notifications</dt>
            <dd className="mt-1 text-muted-foreground">
              {unreadNotifications === 0
                ? "None"
                : `${unreadNotifications} unread`}
            </dd>
          </div>
        </dl>
      </section>

      <nav aria-label="More in your account" className="space-y-3 border-t border-border pt-8">
        <h2 className="font-heading text-lg font-semibold">More in your account</h2>
        <ul className="flex flex-wrap gap-2">
          {(
            [
              ["/dashboard/billing", "Billing"],
              ["/dashboard/consent", "Consent"],
              ["/dashboard/access-history", "Access history"],
              ["/dashboard/documents", "Documents"],
              ["/dashboard/bookings", "Bookings"],
              ["/dashboard/safety", "Safety"],
              ["/dashboard/profile", "Profile"],
              ["/dashboard/settings/notifications", "Notification settings"],
            ] as const
          ).map(([href, label]) => (
            <li key={href}>
              <Link href={href} className={linkClass}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
