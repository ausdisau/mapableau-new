import Link from "next/link";
import { redirect } from "next/navigation";

import { FocusView } from "@/components/personal-agency/FocusView";
import { LifeIntentCard } from "@/components/personal-agency/LifeIntentCard";
import { MyHomeDashboardTop } from "@/components/personal-agency/MyHomeDashboardTop";
import { personalAgencyFlags } from "@/lib/config/personal-agency";
import {
  projectFocusView,
  type FocusViewDensity,
  type FocusViewItem,
} from "@/lib/personal-agency/focus-view";
import { requirePersonalAgencyGate } from "@/lib/personal-agency/gates";
import { listLifeIntentsForPrincipal } from "@/lib/personal-agency/life-intent-service";
import {
  getPaiSetupPreferences,
  needsFirstRunSetup,
} from "@/lib/personal-agency/setup-service";
import { prisma } from "@/lib/prisma";
import { getZonedDayBoundsUtc, getZonedHour } from "@/lib/time/zoned-day";
import {
  BookingRow,
  Section,
  Timeline,
  type TimelineItem,
} from "@mapable/ui";

export const metadata = { title: "My MapAble" };

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function resolveFocusDensity(value: unknown): FocusViewDensity {
  return value === "simpler" || value === "detailed" ? value : "standard";
}

export default async function MyHomePage() {
  const user = await requirePersonalAgencyGate();

  if (!personalAgencyFlags.homeEnabled) {
    redirect("/dashboard");
  }

  if (personalAgencyFlags.firstRunSetupEnabled) {
    const needsSetup = await needsFirstRunSetup(user.id);
    if (needsSetup) redirect("/my/setup");
  }

  const now = new Date();
  const { start: startOfDay, endExclusive: startOfTomorrow } =
    getZonedDayBoundsUtc(now, user.timezone);

  const [
    todayBookings,
    lifeIntents,
    activeCareRequests,
    todayTransportCount,
    upcomingTransport,
    setupPreferences,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: {
        participantId: user.id,
        requestedStart: { gte: startOfDay, lt: startOfTomorrow },
        status: { notIn: ["cancelled"] },
      },
      orderBy: { requestedStart: "asc" },
      take: 8,
      select: {
        id: true,
        bookingType: true,
        requestedStart: true,
        status: true,
        careLocation: true,
      },
    }),
    personalAgencyFlags.lifeIntentsEnabled
      ? listLifeIntentsForPrincipal(user.id).catch(() => [])
      : Promise.resolve([]),
    prisma.careRequest.count({
      where: {
        participantId: user.id,
        status: {
          in: [
            "submitted",
            "awaiting_admin_review",
            "awaiting_provider_response",
            "matched",
            "confirmed",
            "in_progress",
          ],
        },
      },
    }),
    prisma.transportTripRequest.count({
      where: {
        participantId: user.id,
        scheduledStart: { gte: startOfDay, lt: startOfTomorrow },
        status: { notIn: ["cancelled", "completed"] },
      },
    }),
    prisma.transportTripRequest.findMany({
      where: {
        participantId: user.id,
        scheduledStart: { gte: startOfDay },
        status: { notIn: ["cancelled", "completed"] },
      },
      orderBy: { scheduledStart: "asc" },
      take: 3,
      select: {
        id: true,
        pickupSuburb: true,
        dropoffSuburb: true,
        scheduledStart: true,
        status: true,
      },
    }),
    getPaiSetupPreferences(user.id).catch(() => null),
  ]);

  const firstName = user.name.split(/\s+/)[0] ?? user.name;
  const greeting = greetingForHour(getZonedHour(now, user.timezone));
  const primaryGoal = lifeIntents[0] ?? null;

  const timelineItems: TimelineItem[] = todayBookings.map((booking) => ({
    id: booking.id,
    time: formatTime(booking.requestedStart),
    title: (booking.careLocation ??
      booking.bookingType.replace(/_/g, " ")) as string,
    status: booking.status.replace(/_/g, " "),
  }));

  const focusItems: FocusViewItem[] = [
    ...todayBookings.map((booking) => ({
      id: booking.id,
      source: "schedule" as const,
      title: (booking.careLocation ??
        booking.bookingType.replace(/_/g, " ")) as string,
      at: booking.requestedStart,
      status: booking.status,
    })),
    ...upcomingTransport
      .filter((trip) => trip.scheduledStart < startOfTomorrow)
      .map((trip) => ({
        id: trip.id,
        source: "transport" as const,
        title: `${trip.pickupSuburb ?? "Pickup"} → ${trip.dropoffSuburb ?? "destination"}`,
        at: trip.scheduledStart,
        status: trip.status,
        href: "/dashboard/transport",
      })),
  ];

  const focusProjection = projectFocusView(focusItems, now);
  const focusDensity = resolveFocusDensity(setupPreferences?.informationDensity);

  return (
    <div className="space-y-10">
      <MyHomeDashboardTop
        greeting={greeting}
        firstName={firstName}
        dateLabel={formatDate(now, user.timezone)}
        goal={
          primaryGoal
            ? {
                id: primaryGoal.id,
                originalExpression: primaryGoal.originalExpression,
              }
            : null
        }
        lifeIntentsEnabled={personalAgencyFlags.lifeIntentsEnabled}
        todayBookingsCount={todayBookings.length}
        careRequestCount={activeCareRequests}
        todayTransportCount={todayTransportCount}
      />

      <FocusView projection={focusProjection} density={focusDensity} />

      <div id="today-schedule">
        <Section title="Today's schedule" titleId="today-heading">
          <Timeline
            items={timelineItems}
            emptyMessage="Nothing scheduled for today. When you have bookings, they will appear here."
            renderItem={(item) => (
              <BookingRow
                title={item.title}
                time={item.time ?? ""}
                status={item.status ?? ""}
              />
            )}
          />
        </Section>
      </div>

      {lifeIntents.length > 1 ? (
        <Section
          title="Other things that matter to me"
          titleId="other-matters-heading"
          action={
            <Link
              href="/my/life"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-[#005B7F] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
            >
              See all
            </Link>
          }
        >
          <ul className="grid gap-4 sm:grid-cols-2">
            {lifeIntents.slice(1, 4).map((intent) => (
              <li key={intent.id}>
                <LifeIntentCard
                  id={intent.id}
                  originalExpression={intent.originalExpression}
                  status={intent.status}
                />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
