import Link from "next/link";

import {
  certaintyLabel,
  type MyDayAttention,
  type MyDaySnapshot,
} from "@/lib/dashboard/my-day-status";

function StatusBadge({
  status,
}: {
  status: MyDaySnapshot["careSummary"]["status"];
}) {
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

function AttentionBadge({ level, label }: { level: MyDayAttention["level"]; label: string }) {
  const styles =
    level === "ok"
      ? "bg-emerald-50 text-emerald-800"
      : level === "warn"
        ? "bg-amber-50 text-amber-900"
        : level === "bad"
          ? "bg-rose-50 text-rose-800"
          : "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-extrabold ${styles}`}
    >
      {label}
    </span>
  );
}

export function MyDayAttentionPanel({
  attention,
}: {
  attention: MyDayAttention;
}) {
  return (
    <section
      aria-labelledby="my-day-attention-heading"
      className="rounded-2xl border border-[#d7e6f0] bg-gradient-to-br from-[#eff6fa] to-[#f9fbfe] p-6 shadow-sm"
      data-testid="my-day-attention"
    >
      <p className="text-xs font-extrabold uppercase tracking-wide text-[#4b6680]">
        What needs attention
      </p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="my-day-attention-heading"
            className="font-heading text-xl font-bold text-[#0C1833]"
          >
            {attention.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            {attention.description}
          </p>
        </div>
        <AttentionBadge level={attention.level} label={attention.statusLabel} />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={attention.primaryHref}
          className="inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-extrabold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
        >
          {attention.primaryLabel}
        </Link>
        <Link
          href="/dashboard/safety"
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-extrabold text-[#084865] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
        >
          Get human help
        </Link>
      </div>
    </section>
  );
}

export function MyDayComingUpPanel({
  snapshot,
}: {
  snapshot: MyDaySnapshot;
}) {
  return (
    <section
      aria-labelledby="my-day-coming-up-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      data-testid="my-day-coming-up"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2
            id="my-day-coming-up-heading"
            className="font-heading text-xl font-bold text-[#0C1833]"
          >
            Coming up
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Authorised arrangements from your records — not invented schedules.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          As of{" "}
          {new Date(snapshot.generatedAt).toLocaleString("en-AU", {
            timeZone: "Australia/Sydney",
          })}{" "}
          (Australia/Sydney)
        </p>
      </div>

      {snapshot.empty ? (
        <div
          className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5"
          role="status"
        >
          <p className="font-semibold text-[#0C1833]">No arrangements listed</p>
          <p className="mt-1 text-sm text-slate-600">
            Explore services or get human help. Nothing is fabricated here.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <article className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <p className="text-sm font-bold text-[#0C1833]">Care</p>
              <p className="mt-1 text-sm text-slate-600">
                {snapshot.careSummary.label}
              </p>
            </div>
            {snapshot.careSummary.count > 0 ? (
              <StatusBadge status={snapshot.careSummary.status} />
            ) : null}
          </article>
          <article className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <p className="text-sm font-bold text-[#0C1833]">Transport</p>
              <p className="mt-1 text-sm text-slate-600">
                {snapshot.transportSummary.label}
              </p>
            </div>
            {snapshot.transportSummary.count > 0 ? (
              <StatusBadge status={snapshot.transportSummary.status} />
            ) : null}
          </article>

          {snapshot.nearestConfirmed ? (
            <article className="rounded-xl border border-slate-200 bg-[#F8FBFE] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-[#0C1833]">
                  Nearest confirmed
                </h3>
                <StatusBadge status={snapshot.nearestConfirmed.status} />
              </div>
              <p className="mt-2 font-semibold">{snapshot.nearestConfirmed.title}</p>
              <p className="text-sm text-slate-600">
                {snapshot.nearestConfirmed.startsAt
                  ? new Date(snapshot.nearestConfirmed.startsAt).toLocaleString(
                      "en-AU",
                      { timeZone: "Australia/Sydney" },
                    )
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
            </article>
          ) : null}

          {snapshot.pendingActions.length > 0 ? (
            <article className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <h3 className="text-sm font-bold text-[#0C1833]">
                Pending confirmation
              </h3>
              <ul className="mt-3 space-y-2">
                {snapshot.pendingActions.map((item) => (
                  <li key={item.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm">{item.title}</strong>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-700">
                      {item.certaintyNote}
                    </p>
                    <Link
                      href={item.href}
                      className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-[#005B7F] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
                    >
                      Review
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
        </div>
      )}

      <p className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-500">
        Statuses above are derived from authorised MapAble records, including
        freshness and uncertainty. Confirmed facts stay separate from pending
        or unverified items.
      </p>
    </section>
  );
}

export function MyDayProgrammaticSidePanel({
  snapshot,
  onPreviewAi,
}: {
  snapshot: MyDaySnapshot;
  onPreviewAi: () => void;
}) {
  return (
    <section
      aria-labelledby="my-day-programmatic-side-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      data-testid="my-day-programmatic-side"
    >
      <h2
        id="my-day-programmatic-side-heading"
        className="font-heading text-xl font-bold text-[#0C1833]"
      >
        Programmatic View
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        This view shows direct, rule-based information without AI
        interpretation. Booking status, schedule and consent checks remain
        reliable even if AI is unavailable.
      </p>
      <div className="mt-4 rounded-xl border border-[#dce7ef] bg-[#f3f7fb] p-4">
        <h3 className="text-sm font-bold text-[#0C1833]">Why this matters</h3>
        <p className="mt-1 text-sm text-slate-600">
          Source: programmatic records as of{" "}
          {new Date(snapshot.generatedAt).toLocaleString("en-AU", {
            timeZone: "Australia/Sydney",
          })}{" "}
          (Australia/Sydney). No autonomous actions are taken from this page.
        </p>
      </div>
      <div className="mt-5">
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-extrabold text-[#084865] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
          onClick={onPreviewAi}
        >
          Preview optional AI guidance
        </button>
      </div>
    </section>
  );
}

export function MyDayCommonActions() {
  return (
    <section
      aria-labelledby="common-actions-heading"
      className="space-y-4"
      data-testid="my-day-common-actions"
    >
      <h2
        id="common-actions-heading"
        className="font-heading text-xl font-bold text-[#0C1833]"
      >
        Common actions
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/care"
          className="flex min-h-[120px] flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-[#8bbbd4] hover:bg-[#f8fbfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
        >
          <strong className="text-sm text-[#0C1833]">
            Find or manage support
          </strong>
          <span className="text-xs text-slate-600">
            Support choices and worker preferences
          </span>
        </Link>
        <Link
          href="/dashboard/transport"
          className="flex min-h-[120px] flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-[#8bbbd4] hover:bg-[#f8fbfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
        >
          <strong className="text-sm text-[#0C1833]">
            Plan accessible transport
          </strong>
          <span className="text-xs text-slate-600">
            Travel arrangements and requirements
          </span>
        </Link>
        <Link
          href="/dashboard/accessibility"
          className="flex min-h-[120px] flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-[#8bbbd4] hover:bg-[#f8fbfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
        >
          <strong className="text-sm text-[#0C1833]">
            Update my preferences
          </strong>
          <span className="text-xs text-slate-600">
            Accessibility, communication and AAC
          </span>
        </Link>
      </div>
    </section>
  );
}

/** @deprecated Prefer MyDayWorkspace; kept for any residual imports. */
export function MyDayProgrammaticPanel({
  snapshot,
}: {
  snapshot: MyDaySnapshot;
}) {
  return (
    <div className="space-y-4" data-testid="my-day-programmatic-legacy">
      <MyDayComingUpPanel snapshot={snapshot} />
      <MyDayCommonActions />
    </div>
  );
}
