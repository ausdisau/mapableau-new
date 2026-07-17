"use client";

import { AlertTriangle, Clock, ShieldAlert } from "lucide-react";
import Link from "next/link";

type ImmediateItem = {
  id: string;
  label: string;
  urgency: string;
  urgencyDescription: string;
  summary: string;
  href: string;
  immediateSafetyConcern: boolean;
};

type DeadlineItem = {
  id: string;
  ruleCode: string;
  dueAt: string;
  status: string;
  resourceType: string;
  resourceId: string;
};

function UrgencyIcon({ urgency }: { urgency: string }) {
  if (urgency === "critical") {
    return <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden />;
  }
  if (urgency === "high") {
    return <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />;
  }
  return <Clock className="h-5 w-5 shrink-0" aria-hidden />;
}

export function ImmediateSafetyStrip({
  items,
  deadlines,
}: {
  items: ImmediateItem[];
  deadlines: DeadlineItem[];
}) {
  return (
    <section
      aria-labelledby="immediate-safety-heading"
      className="space-y-4 rounded-xl border border-border bg-card p-4"
    >
      <div>
        <h2 id="immediate-safety-heading" className="text-lg font-semibold">
          Immediate safety
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Items that may require action now. Status uses text labels and icons —
          not colour alone.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No open immediate safety concerns in the current scope.
        </p>
      ) : (
        <ul className="space-y-3" aria-live="polite">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex gap-3 rounded-lg border border-border p-3"
            >
              <UrgencyIcon urgency={item.urgency} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  <span className="sr-only">Urgency: </span>
                  {item.urgencyDescription}
                </p>
                <p className="mt-1 text-sm">{item.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                <Link
                  href={item.href}
                  className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open signal
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        <h3 className="text-base font-semibold">Approaching deadlines</h3>
        {deadlines.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            No deadlines due within 72 hours.
          </p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <caption className="sr-only">
                Approaching Quality and Safeguards deadlines
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Rule
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Resource
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Due
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {deadlines.map((d) => (
                  <tr key={d.id} className="border-b border-border/60">
                    <td className="py-2 pr-3">{d.ruleCode}</td>
                    <td className="py-2 pr-3">
                      {d.resourceType}:{d.resourceId.slice(0, 8)}
                    </td>
                    <td className="py-2 pr-3">
                      <time dateTime={d.dueAt}>
                        {new Date(d.dueAt).toLocaleString("en-AU")}
                      </time>
                    </td>
                    <td className="py-2">
                      <span className="font-medium">{d.status.replaceAll("_", " ")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
