import Link from "next/link";

import type { AgencyActivityItem } from "@/lib/personal-agency/agency-activity-service";

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function AgencyActivityList({ items }: { items: AgencyActivityItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
        <p>No agency activity yet.</p>
        <p className="mt-2">
          When you save life intents or explore options, activity will appear
          here.
        </p>
        <Link
          href="/my/life"
          className="mt-3 inline-block font-semibold text-[#005B7F]"
        >
          Add something that matters
        </Link>
      </div>
    );
  }

  const grouped = items.reduce<Record<string, AgencyActivityItem[]>>(
    (acc, item) => {
      const day = new Intl.DateTimeFormat("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date(item.occurredAt));
      acc[day] ??= [];
      acc[day]!.push(item);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([day, dayItems]) => (
        <section key={day} aria-label={day}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#005B7F]">
            {day}
          </h2>
          <ol className="mt-3 space-y-4">
            {dayItems.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <p className="text-xs text-slate-500">
                  {formatTime(item.occurredAt)}
                </p>
                <p className="mt-1 font-semibold text-[#0C1833]">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
                <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-slate-700">
                      Who initiated
                    </dt>
                    <dd className="capitalize">{item.initiator}</dd>
                  </div>
                  {item.approvedBy ? (
                    <div>
                      <dt className="font-semibold text-slate-700">
                        Approved by
                      </dt>
                      <dd>{item.approvedBy}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="font-semibold text-slate-700">Shared</dt>
                    <dd>
                      {item.shared.length ? item.shared.join(", ") : "Nothing"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-700">Reversible</dt>
                    <dd>{item.reversible ? "Yes" : "No"}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
