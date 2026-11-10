import Link from "next/link";

import {
  certaintyLabel,
  type MyDaySnapshot,
} from "@/lib/dashboard/my-day-status";

/**
 * “Changes affecting my day” — authorised snapshot facts only.
 * Never invents schedules or recovery outcomes.
 */
export function DayChangesPanel({ snapshot }: { snapshot: MyDaySnapshot }) {
  const changed = [
    ...snapshot.pendingActions.filter(
      (item) => item.status === "pending" || item.status === "cancelled",
    ),
  ];

  const careChanged =
    snapshot.careSummary.count > 0 &&
    (snapshot.careSummary.status === "cancelled" ||
      snapshot.careSummary.status === "pending" ||
      snapshot.careSummary.status === "unknown");
  const transportChanged =
    snapshot.transportSummary.count > 0 &&
    (snapshot.transportSummary.status === "cancelled" ||
      snapshot.transportSummary.status === "pending" ||
      snapshot.transportSummary.status === "unknown");

  const empty = changed.length === 0 && !careChanged && !transportChanged;

  return (
    <section
      aria-labelledby="day-changes-heading"
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      data-testid="day-changes-panel"
    >
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#005B7F]">
          Changes
        </p>
        <h2
          id="day-changes-heading"
          className="font-heading text-xl font-bold text-[#0C1833]"
        >
          Changes affecting my day
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Only facts from your authorised care and transport records. Status
          uses text labels — colour alone is never the signal.
        </p>
      </div>

      {empty ? (
        <p className="text-sm text-slate-600" role="status">
          No pending or cancelled changes in the current snapshot.
        </p>
      ) : (
        <ul className="space-y-2">
          {changed.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-slate-200 bg-[#F8FBFE] p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm text-[#0C1833]">{item.title}</strong>
                <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-slate-100 px-3 text-xs font-extrabold text-slate-800">
                  <span aria-hidden="true">●</span>
                  {certaintyLabel(item.status)}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-700">{item.certaintyNote}</p>
              <Link
                href={item.href}
                className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-[#005B7F] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
              >
                Review
              </Link>
            </li>
          ))}
          {careChanged ? (
            <li className="rounded-lg border border-slate-200 p-3 text-sm">
              <strong>Care summary:</strong>{" "}
              {certaintyLabel(snapshot.careSummary.status)} —{" "}
              {snapshot.careSummary.label}
              <Link
                href={snapshot.careSummary.href}
                className="ml-2 font-bold text-[#005B7F] underline"
              >
                Open care
              </Link>
            </li>
          ) : null}
          {transportChanged ? (
            <li className="rounded-lg border border-slate-200 p-3 text-sm">
              <strong>Transport summary:</strong>{" "}
              {certaintyLabel(snapshot.transportSummary.status)} —{" "}
              {snapshot.transportSummary.label}
              <Link
                href={snapshot.transportSummary.href}
                className="ml-2 font-bold text-[#005B7F] underline"
              >
                Open transport
              </Link>
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}
