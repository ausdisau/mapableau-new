import Link from "next/link";
import { redirect } from "next/navigation";

import { LifeIntentCard } from "@/components/personal-agency/LifeIntentCard";
import { MyMapAbleAskPrompt } from "@/components/personal-agency/MyMapAbleAskPrompt";
import { personalAgencyFlags } from "@/lib/config/personal-agency";
import { requirePersonalAgencyGate } from "@/lib/personal-agency/gates";
import { listLifeIntentsForPrincipal } from "@/lib/personal-agency/life-intent-service";
import { needsFirstRunSetup } from "@/lib/personal-agency/setup-service";
import { prisma } from "@/lib/prisma";
import {
  AppGrid,
  BookingRow,
  EmptyState,
  ModuleCard,
  PageHeader,
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function summarizeAccessProfile(
  mobilityNeeds: unknown,
  communicationPreferences: unknown,
): string {
  const mobility = Array.isArray(mobilityNeeds) ? mobilityNeeds.length : 0;
  const comm = Array.isArray(communicationPreferences)
    ? communicationPreferences.length
    : 0;
  const parts: string[] = [];
  if (mobility > 0) parts.push(`${mobility} mobility need${mobility === 1 ? "" : "s"}`);
  if (comm > 0) parts.push(`${comm} communication preference${comm === 1 ? "" : "s"}`);
  return parts.length ? parts.join(" · ") : "Add your access needs so providers can support you well.";
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
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [
    todayBookings,
    lifeIntents,
    accessibilityProfile,
    supportProfile,
    activeCareRequests,
    upcomingTransport,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: {
        participantId: user.id,
        requestedStart: { gte: startOfDay, lte: endOfDay },
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
    prisma.accessibilityProfile.findUnique({
      where: { userId: user.id },
      select: {
        mobilityNeeds: true,
        communicationPreferences: true,
        updatedAt: true,
      },
    }),
    prisma.supportProfile.findUnique({
      where: { participantId: user.id },
      select: { publishedAt: true, updatedAt: true },
    }),
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
  ]);

  const firstName = user.name.split(/\s+/)[0] ?? user.name;
  const greeting = greetingForHour(now.getHours());

  const timelineItems: TimelineItem[] = todayBookings.map((booking) => ({
    id: booking.id,
    time: formatTime(booking.requestedStart),
    title: (booking.careLocation ??
      booking.bookingType.replace(/_/g, " ")) as string,
    status: booking.status.replace(/_/g, " "),
  }));

  const accessSummary = accessibilityProfile
    ? summarizeAccessProfile(
        accessibilityProfile.mobilityNeeds,
        accessibilityProfile.communicationPreferences,
      )
    : "Set up your accessibility profile so support matches your needs.";

  const supportMeta = supportProfile?.publishedAt
    ? "Support profile published"
    : supportProfile
      ? "Support profile draft"
      : undefined;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="My MapAble"
        title={`${greeting}, ${firstName}`}
        description={`${formatDate(now)} — Tell MapAble what matters to you. You stay in control of what happens next.`}
      />

      <MyMapAbleAskPrompt />

      <Section title="Today" titleId="today-heading">
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

      <Section title="Your modules" titleId="modules-heading">
        <AppGrid columns={3}>
          <ModuleCard
            title="Access snapshot"
            eyebrow="Accessibility"
            description={accessSummary}
            meta={supportMeta}
            href="/dashboard/accessibility"
            linkComponent={Link}
          />
          <ModuleCard
            title="Care"
            eyebrow="Support"
            description={
              activeCareRequests > 0
                ? `${activeCareRequests} active care request${activeCareRequests === 1 ? "" : "s"}`
                : "Request or manage care support."
            }
            href="/care"
            linkComponent={Link}
          />
          <ModuleCard
            title="Transport"
            eyebrow="Trips"
            description={
              upcomingTransport.length > 0
                ? `Next: ${upcomingTransport[0].pickupSuburb ?? "pickup"} → ${upcomingTransport[0].dropoffSuburb ?? "dropoff"}`
                : "Plan and track accessible transport."
            }
            meta={
              upcomingTransport[0]
                ? formatTime(upcomingTransport[0].scheduledStart)
                : undefined
            }
            href="/dashboard/transport"
            linkComponent={Link}
          />
        </AppGrid>
      </Section>

      <Section
        title="What matters to me"
        titleId="matters-heading"
        action={
          personalAgencyFlags.lifeIntentsEnabled ? (
            <Link
              href="/my/life/new"
              className="text-sm font-semibold text-[#005B7F] hover:underline"
            >
              + Add something
            </Link>
          ) : undefined
        }
      >
        {lifeIntents.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {lifeIntents.slice(0, 4).map((intent) => (
              <li key={intent.id}>
                <LifeIntentCard
                  id={intent.id}
                  originalExpression={intent.originalExpression}
                  status={intent.status}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nothing here yet."
            description="What would you like to do, change, explore or work towards?"
            actionLabel={
              personalAgencyFlags.lifeIntentsEnabled
                ? "Add something that matters"
                : undefined
            }
            actionHref={
              personalAgencyFlags.lifeIntentsEnabled ? "/my/life/new" : undefined
            }
            linkComponent={Link}
          />
        )}
      </Section>

      <Section title="Quick actions" titleId="quick-actions-heading">
        <AppGrid columns={3}>
          {[
            { href: "/go", label: "Go somewhere" },
            { href: "/dashboard/find-support", label: "Find support" },
            { href: "/dashboard/jobs", label: "Work & study" },
            { href: "/dashboard/participation", label: "Sport & recreation" },
            { href: "/my/people", label: "My people" },
            { href: "/my/devices", label: "My devices" },
          ].map((action) => (
            <ModuleCard
              key={action.href}
              title={action.label}
              href={action.href}
              linkComponent={Link}
            />
          ))}
        </AppGrid>
      </Section>
    </div>
  );
}
