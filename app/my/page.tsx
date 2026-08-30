import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ParticipantActionLink,
  ParticipantEyebrow,
  ParticipantMarker,
  ParticipantPanel,
  ParticipantServiceShortcut,
  ParticipantStatus,
  type ParticipantTone,
} from "@/components/mapable-ui/ParticipantUi";
import { LifeIntentCard } from "@/components/personal-agency/LifeIntentCard";
import { MyMapAbleAskPrompt } from "@/components/personal-agency/MyMapAbleAskPrompt";
import { personalAgencyFlags } from "@/lib/config/personal-agency";
import { requirePersonalAgencyGate } from "@/lib/personal-agency/gates";
import { listLifeIntentsForPrincipal } from "@/lib/personal-agency/life-intent-service";
import { needsFirstRunSetup } from "@/lib/personal-agency/setup-service";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "My MapAble" };

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function bookingPresentation(bookingType: string): {
  service: string;
  marker: string;
  tone: ParticipantTone;
} {
  const normalised = bookingType.toLowerCase();
  if (normalised.includes("transport") || normalised.includes("travel")) {
    return { service: "Transport", marker: "T", tone: "travel" };
  }
  if (normalised.includes("care") || normalised.includes("support")) {
    return { service: "Care", marker: "C", tone: "care" };
  }
  if (normalised.includes("job") || normalised.includes("employment")) {
    return { service: "Jobs", marker: "J", tone: "jobs" };
  }
  return { service: "MapAble", marker: "M", tone: "access" };
}

const serviceShortcuts = [
  {
    href: "/care",
    label: "Care",
    marker: "C",
    tone: "care" as const,
    description: "Review care options and authorised bookings.",
  },
  {
    href: "/dashboard/transport",
    label: "Transport",
    marker: "T",
    tone: "travel" as const,
    description: "Review trips and accessible transport information.",
  },
  {
    href: "/dashboard/jobs",
    label: "Jobs",
    marker: "J",
    tone: "jobs" as const,
    description: "Explore work and study without automatic disclosure.",
  },
] as const;

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

  const [todayBookings, lifeIntents] = await Promise.all([
    prisma.booking.findMany({
      where: {
        participantId: user.id,
        requestedStart: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["cancelled"] },
      },
      orderBy: { requestedStart: "asc" },
      take: 5,
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
  ]);

  const firstName = user.name.split(/\s+/)[0] ?? user.name;
  const greeting = greetingForHour(now.getHours());

  return (
    <div className="space-y-8">
      <header className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#005B7F]">
          My MapAble
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-[#0C1833] sm:text-4xl">
          {greeting}, {firstName}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          See what is happening today, review what each service can access, and bring a person
          into the conversation whenever you want. You stay in control of what happens next.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-8">
          <MyMapAbleAskPrompt />

          <ParticipantPanel labelledBy="today-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="today-heading"
                  className="font-heading text-2xl font-bold text-[#0C1833]"
                >
                  Today
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Each service stays distinct so you can review its status and information separately.
                </p>
              </div>
              <ParticipantActionLink href="/dashboard/calendar">
                View calendar
              </ParticipantActionLink>
            </div>

            {todayBookings.length ? (
              <ol className="mt-6 space-y-3">
                {todayBookings.map((booking) => {
                  const presentation = bookingPresentation(booking.bookingType);
                  const title = booking.careLocation ?? booking.bookingType.replace(/_/g, " ");
                  return (
                    <li
                      key={booking.id}
                      className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                    >
                      <ParticipantMarker
                        label={presentation.marker}
                        tone={presentation.tone}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <ParticipantEyebrow tone={presentation.tone}>
                            {presentation.service}
                          </ParticipantEyebrow>
                          <p className="text-sm font-semibold text-slate-500">
                            {new Intl.DateTimeFormat("en-AU", {
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(booking.requestedStart)}
                          </p>
                        </div>
                        <p className="mt-1 break-words text-base font-bold capitalize text-[#0C1833]">
                          {title}
                        </p>
                      </div>
                      <ParticipantStatus
                        label={booking.status.replace(/_/g, " ")}
                        tone={presentation.tone}
                      />
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <p className="font-bold text-[#0C1833]">Nothing scheduled for today.</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  When you have authorised bookings, they will appear here. MapAble does not book a
                  service automatically.
                </p>
              </div>
            )}
          </ParticipantPanel>

          <section aria-labelledby="services-heading">
            <div>
              <h2
                id="services-heading"
                className="font-heading text-2xl font-bold text-[#0C1833]"
              >
                Your services
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Move between services without combining permissions or consent.
              </p>
            </div>
            <ul className="mt-4 grid gap-4 md:grid-cols-3">
              {serviceShortcuts.map((service) => (
                <li key={service.href}>
                  <ParticipantServiceShortcut {...service} />
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="matters-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="matters-heading"
                  className="font-heading text-2xl font-bold text-[#0C1833]"
                >
                  What matters to me
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Keep your goals and priorities visible without turning them into automatic instructions.
                </p>
              </div>
              {personalAgencyFlags.lifeIntentsEnabled ? (
                <ParticipantActionLink href="/my/life/new">
                  Add something
                </ParticipantActionLink>
              ) : null}
            </div>
            {lifeIntents.length ? (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
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
              <div className="mt-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6">
                <p className="font-bold text-[#0C1833]">Nothing here yet.</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  What would you like to do, change, explore or work towards?
                </p>
                {personalAgencyFlags.lifeIntentsEnabled ? (
                  <ParticipantActionLink
                    href="/my/life/new"
                    tone="access"
                    variant="solid"
                    className="mt-4"
                  >
                    Add something that matters
                  </ParticipantActionLink>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    Life intents are in development behind feature flags.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <aside
          aria-label="Participant controls"
          className="space-y-4 xl:sticky xl:top-6 xl:self-start"
        >
          <ParticipantPanel labelledBy="access-panel-heading" tone="access">
            <ParticipantEyebrow tone="access">Your information</ParticipantEyebrow>
            <h2 id="access-panel-heading" className="mt-2 text-xl font-bold text-[#0C1833]">
              My Access
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              You choose what each service can see. Accessibility preferences and consent remain
              separate controls.
            </p>
            <div className="mt-4 grid gap-2">
              <ParticipantActionLink
                href="/dashboard/accessibility"
                tone="access"
                fullWidth
              >
                Accessibility preferences
              </ParticipantActionLink>
              <ParticipantActionLink href="/dashboard/consent" fullWidth>
                Review sharing
              </ParticipantActionLink>
            </div>
          </ParticipantPanel>

          <ParticipantPanel labelledBy="help-panel-heading" tone="support">
            <ParticipantEyebrow tone="support">Human support</ParticipantEyebrow>
            <h2 id="help-panel-heading" className="mt-2 text-xl font-bold text-[#0C1833]">
              Need help?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Talk to a person when you want help understanding options, fixing a problem or
              escalating a concern.
            </p>
            <ParticipantActionLink
              href="/dashboard/safety"
              tone="support"
              fullWidth
              className="mt-4"
            >
              Get human support
            </ParticipantActionLink>
          </ParticipantPanel>

          <ParticipantPanel labelledBy="choices-panel-heading">
            <h2 id="choices-panel-heading" className="text-lg font-bold text-[#0C1833]">
              Your choices
            </h2>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              <li>Nothing is booked automatically.</li>
              <li>Service information is not silently shared across modules.</li>
              <li>You can review consent and ask for a person at any time.</li>
            </ul>
            <ParticipantActionLink href="/my/control" fullWidth className="mt-4">
              Review controls
            </ParticipantActionLink>
          </ParticipantPanel>
        </aside>
      </div>

      <section aria-labelledby="quick-actions-heading">
        <h2
          id="quick-actions-heading"
          className="font-heading text-2xl font-bold text-[#0C1833]"
        >
          More ways to use MapAble
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/go", label: "Go somewhere" },
            { href: "/dashboard/find-support", label: "Find support" },
            { href: "/dashboard/participation", label: "Sport & recreation" },
            { href: "/my/people", label: "My people" },
            { href: "/my/devices", label: "My devices" },
            { href: "/dashboard/messages", label: "Messages" },
          ].map((action) => (
            <li key={action.href}>
              <Link
                href={action.href}
                className="flex min-h-12 items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#005B7F] shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
              >
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
