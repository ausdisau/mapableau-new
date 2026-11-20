"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  addCalendarDays,
  formatDateHeading,
  formatSydneyTime,
  getWeekDates,
  isCompletedStatus,
  sydneyDateKey,
  type CareSchedulerData,
  type CareSchedulerEntry,
  type CareSchedulerRole,
} from "@/lib/care/scheduler/ui-model";

type View = "week" | "list";
type Filter = "all" | "attention" | "upcoming" | "completed";
type Props = {
  role: CareSchedulerRole;
  weekStart: string;
  data: CareSchedulerData;
  organisationId?: string;
};

const ROLE_COPY: Record<
  CareSchedulerRole,
  { title: string; description: string; primaryHref: string; primaryLabel: string }
> = {
  participant: {
    title: "My care and support",
    description: "Review scheduled supports, check who is assigned and choose when to ask for changes.",
    primaryHref: "/care/request",
    primaryLabel: "Request support",
  },
  provider: {
    title: "Care and support roster",
    description: "Review your organisation's shift coverage. Assignment and approval still happen in the existing Care workflow.",
    primaryHref: "/provider/care/roster",
    primaryLabel: "Manage existing roster",
  },
  worker: {
    title: "My shifts",
    description: "See your scheduled shifts and follow up on offers without disclosing participant details in the calendar.",
    primaryHref: "/worker/today",
    primaryLabel: "Review shift offers",
  },
};

function getStatusStyle(entry: CareSchedulerEntry): string {
  if (entry.attention) {
    return "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100";
  }
  if (isCompletedStatus(entry.status)) {
    return "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-100";
  }
  return "border-violet-300 bg-violet-50 text-violet-950 dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-100";
}

function ShiftCard({ entry, role }: { entry: CareSchedulerEntry; role: CareSchedulerRole }) {
  const crossesMidnight = sydneyDateKey(entry.endAt) !== entry.date;
  const time =
    formatSydneyTime(entry.startAt) +
    "–" +
    formatSydneyTime(entry.endAt) +
    (crossesMidnight ? " (next day)" : "");
  const subject =
    role === "provider"
      ? entry.participantLabel
      : role === "participant"
        ? entry.workerLabel
        : entry.service;

  return (
    <Link
      href={entry.href}
      className="block min-h-11 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
      aria-label={subject + ", " + time + ", " + entry.statusLabel + ". View details."}
    >
      <span className="block text-xs font-bold tabular-nums text-foreground">{time}</span>
      <span className="mt-1 block truncate text-sm font-semibold text-foreground">{subject}</span>
      <span
        className={"mt-2 inline-block rounded-md border px-2 py-1 text-xs font-medium " + getStatusStyle(entry)}
      >
        {entry.attention ? "Review needed · " : ""}{entry.statusLabel}
      </span>
    </Link>
  );
}

export function CareSchedulerBoard({
  role,
  weekStart,
  data,
  organisationId,
}: Props) {
  const [view, setView] = useState<View>("week");
  const [filter, setFilter] = useState<Filter>("all");
  const days = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const copy = ROLE_COPY[role];
  const filtered = useMemo(() => {
    const now = Date.now();
    return data.entries.filter((entry) => {
      if (filter === "attention") return entry.attention;
      if (filter === "upcoming") {
        return new Date(entry.startAt).valueOf() >= now && !isCompletedStatus(entry.status);
      }
      if (filter === "completed") return isCompletedStatus(entry.status);
      return true;
    });
  }, [data.entries, filter]);

  const attentionCount = data.entries.filter((entry) => entry.attention).length;
  const unallocatedCount = data.entries.filter((entry) => !entry.workerId).length;
  const firstWeekday = formatDateHeading(days[0]);
  const lastWeekday = formatDateHeading(days[6]);

  function weekHref(date: string): string {
    return (
      (role === "provider" ? "/provider/care/scheduler" : role === "worker" ? "/worker/schedule" : "/care/scheduler") +
      "?week=" +
      encodeURIComponent(date) +
      (organisationId ? "&organisationId=" + encodeURIComponent(organisationId) : "")
    );
  }

  const workerRows = [
    ...data.workers,
    ...(unallocatedCount && role === "provider"
      ? [{ id: "__unallocated__", label: "Unallocated shifts" }]
      : []),
  ];

  function showInCell(entry: CareSchedulerEntry, workerId: string): boolean {
    return workerId === "__unallocated__" ? !entry.workerId : entry.workerId === workerId;
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-7 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-orange-50 p-5 dark:border-violet-800 dark:from-violet-950/40 dark:via-background dark:to-orange-950/20 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-800 dark:text-violet-200">
          MapAble Care · Scheduler preview
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {copy.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
              {copy.description}
            </p>
          </div>
          <Link
            href={copy.primaryHref}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-800 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            {copy.primaryLabel}
          </Link>
        </div>
      </div>

      <div
        role="note"
        className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-700 dark:bg-amber-950/25 dark:text-amber-100"
      >
        <strong>Read-only pilot view.</strong> This calendar reflects saved CareShift records.
        A scheduled shift is not proof that a worker accepted it or that the participant approved
        a change. Requests, assignments and cancellations use existing, separately authorised workflows.
        Linked Transport is never changed from this screen.
      </div>

      <section aria-label="Scheduling overview" className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Shifts in this week</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">{data.entries.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Needs review</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">{attentionCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            {role === "provider" ? "Unallocated shifts" : "Currently displayed"}
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
            {role === "provider" ? unallocatedCount : filtered.length}
          </p>
        </div>
      </section>

      <section aria-labelledby="schedule-heading" className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="schedule-heading" className="font-heading text-xl font-bold text-foreground">
              Week of {firstWeekday} – {lastWeekday}
            </h2>
            <p className="text-sm text-muted-foreground">All times shown in Australia/Sydney.</p>
          </div>
          <nav aria-label="Choose schedule week" className="flex gap-2">
            <Link
              href={weekHref(addCalendarDays(weekStart, -7))}
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
            >
              Previous week
            </Link>
            <Link
              href={weekHref(addCalendarDays(weekStart, 7))}
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
            >
              Next week
            </Link>
          </nav>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div className="flex gap-2" role="group" aria-label="Schedule presentation">
            <button
              type="button"
              aria-pressed={view === "week"}
              onClick={() => setView("week")}
              className={"min-h-11 rounded-lg border px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 " +
                (view === "week" ? "border-violet-800 bg-violet-800 text-white" : "border-border text-foreground")}
            >
              Week grid
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={"min-h-11 rounded-lg border px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 " +
                (view === "list" ? "border-violet-800 bg-violet-800 text-white" : "border-border text-foreground")}
            >
              Accessible list
            </button>
          </div>
          <div className="min-w-[200px]">
            <label htmlFor="care-schedule-filter" className="block text-sm font-medium text-foreground">
              Show
            </label>
            <select
              id="care-schedule-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value as Filter)}
              className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
            >
              <option value="all">All shifts</option>
              <option value="attention">Needs review</option>
              <option value="upcoming">Upcoming shifts</option>
              <option value="completed">Completed / approved</option>
            </select>
          </div>
        </div>

        <p role="status" aria-live="polite" className="my-4 text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "shift" : "shifts"} shown.
          {data.truncated ? " Results are capped at 200; narrow this week with your coordinator." : ""}
        </p>

        {view === "list" ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-[650px] w-full border-collapse text-left text-sm">
              <caption className="sr-only">Care shifts for the selected week, with status and links to details</caption>
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-3 py-3">Day</th>
                  <th scope="col" className="px-3 py-3">Time</th>
                  <th scope="col" className="px-3 py-3">{role === "provider" ? "Participant" : "Support"}</th>
                  <th scope="col" className="px-3 py-3">Worker</th>
                  <th scope="col" className="px-3 py-3">Status</th>
                  <th scope="col" className="px-3 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} className="border-t border-border">
                    <td className="px-3 py-3">{formatDateHeading(entry.date)}</td>
                    <td className="px-3 py-3 tabular-nums">{formatSydneyTime(entry.startAt)}–{formatSydneyTime(entry.endAt)}</td>
                    <td className="px-3 py-3">{role === "provider" ? entry.participantLabel : entry.service}</td>
                    <td className="px-3 py-3">{entry.workerLabel}</td>
                    <td className="px-3 py-3">{entry.attention ? "Review needed: " : ""}{entry.statusLabel}</td>
                    <td className="px-3 py-3">
                      <Link className="inline-flex min-h-11 items-center font-semibold text-violet-800 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 dark:text-violet-300" href={entry.href}>
                        View shift
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length ? (
              <p className="p-4 text-sm text-muted-foreground">No shifts match this filter. Choose All shifts to review the whole week.</p>
            ) : null}
          </div>
        ) : role === "provider" ? (
          <div className="max-w-full overflow-x-auto rounded-xl border border-border" tabIndex={0} aria-label="Roster matrix; scroll horizontally for other days">
            <table className="w-full min-w-[1030px] border-collapse text-left text-sm">
              <caption className="sr-only">Workers by day of week; unallocated shifts have a separate row</caption>
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="sticky left-0 z-10 min-w-44 border-b border-r border-border bg-muted p-3">Worker / resource</th>
                  {days.map((day) => (
                    <th key={day} scope="col" className="min-w-32 border-b border-border p-3">{formatDateHeading(day)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workerRows.map((worker) => (
                  <tr key={worker.id} className="border-t border-border align-top">
                    <th scope="row" className="sticky left-0 z-10 border-r border-border bg-card p-3 text-sm font-semibold">{worker.label}</th>
                    {days.map((day) => (
                      <td key={worker.id + ":" + day} className="border-r border-border/50 p-2 align-top">
                        <ul className="space-y-2">
                          {filtered
                            .filter((entry) => entry.date === day && showInCell(entry, worker.id))
                            .map((entry) => (
                              <li key={entry.id}><ShiftCard entry={entry} role={role}/></li>
                            ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!workerRows.length ? <p className="p-4 text-muted-foreground">No active workers or scheduled shifts for this organisation.</p> : null}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            {days.map((day) => {
              const shifts = filtered.filter((entry) => entry.date === day);
              return (
                <section key={day} aria-label={formatDateHeading(day)} className="min-w-0 rounded-xl border border-border bg-background p-3">
                  <h3 className="mb-3 text-sm font-bold text-foreground">{formatDateHeading(day)}</h3>
                  <ul className="space-y-2">
                    {shifts.map((entry) => <li key={entry.id}><ShiftCard entry={entry} role={role}/></li>)}
                  </ul>
                  {!shifts.length ? <p className="text-xs text-muted-foreground">No shifts</p> : null}
                </section>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold text-foreground">Changes and continuity</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            If support becomes unavailable, use the existing Care booking or shift details to request
            assistance. A replacement worker needs appropriate checks and participant involvement.
            Linked transport remains a separate decision.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={role === "worker" ? "/worker/report-issue" : role === "provider" ? "/provider/care/requests" : "/care/bookings"}
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground underline underline-offset-4">
              {role === "worker" ? "Report a problem" : "Review Care bookings"}
            </Link>
            <Link href={role === "provider" ? "/provider/transport" : "/dashboard/transport"}
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground underline underline-offset-4">
              Transport trips
            </Link>
          </div>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold text-foreground">About this view</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This view is based on saved shifts, not a live eligibility or screening service.
            Worker and participant approvals, service agreements, attendance and billing have their
            own evidence and workflow requirements.
          </p>
          <details className="mt-4 text-sm">
            <summary className="min-h-11 cursor-pointer rounded-lg py-2 font-semibold text-violet-800 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 dark:text-violet-300">
              What does "Needs review" mean?
            </summary>
            <p className="mt-2 text-muted-foreground">
              An unallocated shift, cancellation, no-show, dispute or other exceptional status
              needs a person's review. This flag is not a clinical or safeguarding determination.
            </p>
          </details>
        </section>
      </div>
    </div>
  );
}
