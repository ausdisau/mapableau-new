import Link from "next/link";
import { redirect } from "next/navigation";

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

function bookingPresentation(bookingType: string) {
  const normalised = bookingType.toLowerCase();
  if (normalised.includes("transport") || normalised.includes("travel")) {
    return {
      service: "Transport",
      marker: "T",
      markerClass: "bg-blue-50 text-blue-700",
      labelClass: "text-blue-700",
      statusClass: "border-blue-200 bg-blue-50 text-blue-800",
    };
  }
  if (normalised.includes("care") || normalised.includes("support")) {
    return {
      service: "Care",
      marker: "C",
      markerClass: "bg-purple-50 text-purple-700",
      labelClass: "text-purple-700",
      statusClass: "border-purple-200 bg-purple-50 text-purple-800",
    };
  }
  return {
    service: "MapAble",
    marker: "M",
    markerClass: "bg-cyan-50 text-[#005B7F]",
    labelClass: "text-[#005B7F]",
    statusClass: "border-cyan-200 bg-cyan-50 text-[#005B7F]",
  };
}

const serviceShortcuts = [
  {
    href: "/care",
    label: "Care",
    marker: "C",
    markerClass: "bg-purple-50 text-purple-700",
    buttonClass: "bg-purple-700 text-white hover:bg-purple-800",
    description: "Review care options and authorised bookings.",
  },
  {
    href: "/dashboard/transport",
    label: "Transport",
    marker: "T",
    markerClass: "bg-blue-50 text-blue-700",
    buttonClass: "bg-blue-700 text-white hover:bg-blue-800",
    description: "Review trips and accessible transport information.",
  },
  {
    href: "/dashboard/jobs",
    label: "Jobs",
    marker: "J",
    markerClass: "bg-orange-50 text-orange-700",
    buttonClass: "bg-orange-600 text-white hover:bg-orange-700",
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

          <section aria-labelledby="today-heading" className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="today-heading" className="font-heading text-2xl font-bold text-[#0C1833]">
                  Today
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Each service stays distinct so you can review its status and information separately.
                </p>
              </div>
              <Link
                href="/dashboard/calendar"
                className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                View calendar
              </Link>
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
                      <span
                        aria-hidden="true"
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black ${presentation.markerClass}`}
                      >
                        {presentation.marker}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className={`text-xs font-black uppercase tracking-[0.12em] ${presentation.labelClass}`}>
                            {presentation.service}
                          </p>
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
                      <span className={`w-fit rounded-full border px-3 py-2 text-xs font-black capitalize ${presentation.statusClass}`}>
                        {booking.status.replace(/_/g, " ")}
                      </span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <p className="font-bold text-[#0C1833]">Nothing scheduled for today.</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  When you have authorised bookings, they will appear here. MapAble does not book a service automatically.
                </p>
              </div>
            )}
          </section>

          <section aria-labelledby="services-heading">
            <div>
              <h2 id="services-heading" className="font-heading text-2xl font-bold text-[#0C1833]">
                Your services
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Move between services without combining permissions or consent.
              </p>
            </div>
            <ul className="mt-4 grid gap-4 md:grid-cols-3">
              {serviceShortcuts.map((service) => (
                <li key={service.href} className="flex rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex w-full flex-col">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black ${service.markerClass}`}
                      >
                        {service.marker}
                      </span>
                      <h3 className="text-lg font-bold text-[#0C1833]">{service.label}</h3>
                    </div>
                    <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{service.description}</p>
                    <Link
                      href={service.href}
                      className={`mt-5 inline-flex min-h-12 items-center justify-between rounded-xl px-4 py-3 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 ${service.buttonClass}`}
                    >
                      View {service.label.toLowerCase()}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="matters-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="matters-heading" className="font-heading text-2xl font-bold text-[#0C1833]">
                  What matters to me
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Keep your goals and priorities visible without turning them into automatic instructions.
                </p>
              </div>
              {personalAgencyFlags.lifeIntentsEnabled ? (
                <Link
                  href="/my/life/new"
                  className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-[#005B7F] hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
                >
                  Add something
                </Link>
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
                  <Link
                    href="/my/life/new"
                    className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-[#005B7F] px-4 py-3 text-sm font-black text-white hover:bg-[#004766] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
                  >
                    Add something that matters
                  </Link>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    Life intents are in development behind feature flags.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <aside aria-label="Participant controls" className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-[1.5rem] border border-blue-100 bg-white p-5 shadow-sm" aria-labelledby="access-panel-heading">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">Your information</p>
            <h2 id="access-panel-heading" className="mt-2 text-xl font-bold text-[#0C1833]">
              My Access
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              You choose what each service can see. Accessibility preferences and consent remain separate controls.
            </p>
            <div className="mt-4 grid gap-2">
              <Link
                href="/dashboard/accessibility"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-300 px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                Accessibility preferences
              </Link>
              <Link
                href="/dashboard/consent"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-black text-[#0C1833] hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                Review sharing
              </Link>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-purple-200 bg-purple-50 p-5" aria-labelledby="help-panel-heading">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-purple-700">Human support</p>
            <h2 id="help-panel-heading" className="mt-2 text-xl font-bold text-[#0C1833]">
              Need help?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Talk to a person when you want help understanding options, fixing a problem or escalating a concern.
            </p>
            <Link
              href="/dashboard/safety"
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-purple-400 bg-white px-4 py-3 text-sm font-black text-purple-800 hover:bg-purple-100 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
            >
              Get human support
            </Link>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="choices-panel-heading">
            <h2 id="choices-panel-heading" className="text-lg font-bold text-[#0C1833]">
              Your choices
            </h2>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              <li>Nothing is booked automatically.</li>
              <li>Service information is not silently shared across modules.</li>
              <li>You can review consent and ask for a person at any time.</li>
            </ul>
            <Link
              href="/my/control"
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-black text-[#005B7F] hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
            >
              Review controls
            </Link>
          </section>
        </aside>
      </div>

      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="font-heading text-2xl font-bold text-[#0C1833]">
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
                className="flex min-h-12 items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#005B7F] shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
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
