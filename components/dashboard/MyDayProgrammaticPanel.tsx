import Link from "next/link";

import {
  certaintyLabel,
  type MyDaySnapshot,
} from "@/lib/dashboard/my-day-status";

function StatusBadge({ status }: { status: MyDaySnapshot["careSummary"]["status"] }) {
  const styles =
    status === "confirmed"
      ? "bg-emerald-50 text-emerald-800"
      : status === "pending"
        ? "bg-amber-50 text-amber-900"
        : status === "cancelled"
          ? "bg-rose-50 text-rose-800"
          : "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-extrabold ${styles}`}
    >
      {certaintyLabel(status)}
    </span>
  );
}

export function MyDayProgrammaticPanel({
  snapshot,
}: {
  snapshot: MyDaySnapshot;
}) {
  return (
    <section
      aria-labelledby="my-day-programmatic-heading"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      data-testid="my-day-programmatic"
      data-source={snapshot.source}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#005B7F]">
            Programmatic view
          </p>
          <h2
            id="my-day-programmatic-heading"
            className="font-heading text-2xl font-bold text-[#0C1833]"
          >
            My Day
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Statuses come from your authorised care and transport records.
            Confirmed facts are separated from pending or unverified items. No
            schedules are invented.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          As of {new Date(snapshot.generatedAt).toLocaleString("en-AU", {
            timeZone: "Australia/Sydney",
          })}{" "}
          (Australia/Sydney)
        </p>
      </div>

      {snapshot.empty ? (
        <div
          className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5"
          role="status"
        >
          <p className="font-semibold text-[#0C1833]">Nothing scheduled yet</p>
          <p className="mt-1 text-sm text-slate-600">
            When you have care or transport arrangements, they will appear here.
            You can explore services without inventing a timetable.
          </p>
          <ul className="mt-4 flex flex-wrap gap-3">
            <li>
              <Link
                href="/dashboard/find-support"
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-[#005B7F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
              >
                Find places &amp; services
              </Link>
            </li>
            <li>
              <Link
                href="/care"
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-[#005B7F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
              >
                Explore care
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/safety"
                className="inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
              >
                Help &amp; safety
              </Link>
            </li>
          </ul>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <article className="rounded-xl border border-slate-200 bg-[#F8FBFE] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-base font-bold text-[#0C1833]">
                  Nearest confirmed activity
                </h3>
                {snapshot.nearestConfirmed ? (
                  <StatusBadge status={snapshot.nearestConfirmed.status} />
                ) : null}
              </div>
              {snapshot.nearestConfirmed ? (
                <>
                  <p className="mt-2 font-semibold">
                    {snapshot.nearestConfirmed.title}
                  </p>
                  <p className="text-sm text-slate-600">
                    {snapshot.nearestConfirmed.startsAt
                      ? new Date(
                          snapshot.nearestConfirmed.startsAt,
                        ).toLocaleString("en-AU", {
                          timeZone: "Australia/Sydney",
                        })
                      : "Time not set on record"}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {snapshot.nearestConfirmed.certaintyNote}
                  </p>
                  <Link
                    href={snapshot.nearestConfirmed.href}
                    className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-[#005B7F] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
                  >
                    Open details
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-600" role="status">
                  No confirmed upcoming activity in the next week.
                </p>
              )}
            </article>

            <article className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-base font-bold text-[#0C1833]">
                Pending actions
              </h3>
              {snapshot.pendingActions.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">
                  Nothing is waiting on confirmation right now.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {snapshot.pendingActions.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-amber-200 bg-amber-50/60 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm">{item.title}</strong>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-700">
                        {item.certaintyNote}
                      </p>
                      <Link
                        href={item.href}
                        className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-[#005B7F] underline"
                      >
                        Review
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>

          <aside className="space-y-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
                Care
              </h3>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  {snapshot.careSummary.label}
                </p>
                {snapshot.careSummary.count > 0 ? (
                  <StatusBadge status={snapshot.careSummary.status} />
                ) : null}
              </div>
              <Link
                href={snapshot.careSummary.href}
                className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-[#005B7F] underline"
              >
                Care bookings
              </Link>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
                Transport
              </h3>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  {snapshot.transportSummary.label}
                </p>
                {snapshot.transportSummary.count > 0 ? (
                  <StatusBadge status={snapshot.transportSummary.status} />
                ) : null}
              </div>
              <Link
                href={snapshot.transportSummary.href}
                className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-[#005B7F] underline"
              >
                Transport trips
              </Link>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
                Common actions
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link className="font-bold text-[#005B7F] underline" href="/dashboard/accessibility">
                    Accessibility preferences
                  </Link>
                </li>
                <li>
                  <Link className="font-bold text-[#005B7F] underline" href="/dashboard/consent">
                    Privacy &amp; consent
                  </Link>
                </li>
                <li>
                  <Link className="font-bold text-[#005B7F] underline" href="/dashboard/safety">
                    Help &amp; safety
                  </Link>
                </li>
                <li>
                  <Link className="font-bold text-[#005B7F] underline" href="/dashboard/messages">
                    Messages
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
