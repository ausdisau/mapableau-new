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
    <div className="space-y-10">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#005B7F]">
          My MapAble
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#0C1833]">
          {greeting}, {firstName}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Tell MapAble what matters to you. MapAble can help assemble your options. You stay
          in control of what happens next.
        </p>
      </header>

      <MyMapAbleAskPrompt />

      <section aria-labelledby="today-heading">
        <h2 id="today-heading" className="text-xl font-bold">
          Today
        </h2>
        {todayBookings.length ? (
          <ul className="mt-4 space-y-3">
            {todayBookings.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-semibold capitalize">
                    {booking.careLocation ?? booking.bookingType.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm text-slate-600">
                    {new Intl.DateTimeFormat("en-AU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(booking.requestedStart)}
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#005B7F]">
                  {booking.status.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Nothing scheduled for today. When you have bookings, they will appear here.
          </p>
        )}
      </section>

      <section aria-labelledby="matters-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="matters-heading" className="text-xl font-bold">
            What matters to me
          </h2>
          {personalAgencyFlags.lifeIntentsEnabled ? (
            <Link
              href="/my/life/new"
              className="text-sm font-semibold text-[#005B7F] hover:underline"
            >
              + Add something
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
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-sm text-slate-700">Nothing here yet.</p>
            <p className="mt-2 text-sm text-slate-600">
              What would you like to do, change, explore or work towards?
            </p>
            {personalAgencyFlags.lifeIntentsEnabled ? (
              <Link
                href="/my/life/new"
                className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#005B7F] px-4 py-2 text-sm font-semibold text-white"
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

      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="text-xl font-bold">
          Quick actions
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/go", label: "Go somewhere" },
            { href: "/dashboard/find-support", label: "Find support" },
            { href: "/dashboard/jobs", label: "Work & study" },
            { href: "/dashboard/participation", label: "Sport & recreation" },
            { href: "/my/people", label: "My people" },
            { href: "/my/devices", label: "My devices" },
          ].map((action) => (
            <li key={action.href}>
              <Link
                href={action.href}
                className="flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#005B7F] hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
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
