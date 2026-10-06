import Link from "next/link";

type GoalSummary = {
  id: string;
  originalExpression: string;
};

type Props = {
  greeting: string;
  firstName: string;
  dateLabel: string;
  goal: GoalSummary | null;
  lifeIntentsEnabled: boolean;
  todayBookingsCount: number;
  careRequestCount: number;
  todayTransportCount: number;
};

const QUICK_ACTIONS = [
  {
    href: "/care",
    title: "Care",
    description: "Find or manage support.",
  },
  {
    href: "/dashboard/transport",
    title: "Transport",
    description: "Plan or review accessible trips.",
  },
  {
    href: "/dashboard/jobs",
    title: "Jobs",
    description: "Explore work and study options.",
  },
  {
    href: "/dashboard/accessibility",
    title: "Access",
    description: "Review your access preferences.",
  },
  {
    href: "/access",
    title: "Accessibility map",
    description: "Explore places and access evidence.",
  },
  {
    href: "/my/ask",
    title: "Ask MapAble",
    description: "Describe what you want help with.",
  },
] as const;

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function MyHomeDashboardTop({
  greeting,
  firstName,
  dateLabel,
  goal,
  lifeIntentsEnabled,
  todayBookingsCount,
  careRequestCount,
  todayTransportCount,
}: Props) {
  const goalHref = goal
    ? `/my/life/${goal.id}`
    : lifeIntentsEnabled
      ? "/my/life/new"
      : "/my/ask?q=Help%20me%20plan%20something%20that%20matters%20to%20me";

  return (
    <div className="space-y-6" data-testid="my-home-dashboard-top">
      <header className="space-y-2">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#005B7F]">
          My MapAble
        </p>
        <h1 className="text-3xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-4xl">
          <span className="sr-only">My MapAble. </span>
          {greeting}, {firstName}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          {dateLabel}. Start with what matters to you, then choose what MapAble
          should help with.
        </p>
      </header>

      <section
        aria-labelledby="my-goal-heading"
        className="rounded-2xl border border-[#005B7F]/20 bg-[#F6FBFC] p-5 shadow-sm"
      >
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#005B7F]">
          What matters to you
        </p>
        <h2
          id="my-goal-heading"
          className="mt-1 text-xl font-black tracking-[-0.02em] text-[#0C1833]"
        >
          {goal ? "Your current goal" : "Start with something that matters"}
        </h2>

        {goal ? (
          <p className="mt-3 max-w-3xl rounded-xl bg-white p-4 text-base font-semibold leading-6 text-slate-900">
            {goal.originalExpression}
          </p>
        ) : (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            Tell MapAble what you want to do, change, explore or work towards.
            You can edit or stop at any time.
          </p>
        )}

        <Link
          href={goalHref}
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#005B7F] px-4 py-2 text-sm font-bold text-white hover:bg-[#004A66] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
        >
          {goal ? "Continue my goal" : lifeIntentsEnabled ? "Set a goal" : "Plan with MapAble"}
        </Link>
      </section>

      <section aria-labelledby="today-at-a-glance-heading" className="space-y-3">
        <div>
          <h2
            id="today-at-a-glance-heading"
            className="text-xl font-black tracking-[-0.02em] text-[#0C1833]"
          >
            Today at a glance
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            A compact view of activity already recorded in MapAble.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/my#today-schedule"
            className="min-h-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
          >
            <p className="text-2xl font-black text-[#0C1833]">{todayBookingsCount}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {countLabel(todayBookingsCount, "activity today", "activities today")}
            </p>
          </Link>

          <Link
            href="/care"
            className="min-h-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
          >
            <p className="text-2xl font-black text-[#0C1833]">{careRequestCount}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {countLabel(careRequestCount, "active care request", "active care requests")}
            </p>
          </Link>

          <Link
            href="/dashboard/transport"
            className="min-h-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
          >
            <p className="text-2xl font-black text-[#0C1833]">{todayTransportCount}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {countLabel(todayTransportCount, "trip today", "trips today")}
            </p>
          </Link>
        </div>
      </section>

      <section aria-labelledby="home-quick-actions-heading" className="space-y-3">
        <div>
          <h2
            id="home-quick-actions-heading"
            className="text-xl font-black tracking-[-0.02em] text-[#0C1833]"
          >
            Quick actions
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Choose where you want to go next. These links do not book or share
            anything on their own.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <li key={action.href}>
              <Link
                href={action.href}
                className="block min-h-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[#005B7F]/40 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
              >
                <h3 className="font-bold text-[#0C1833]">{action.title}</h3>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  {action.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
