import type { ReplayAccessibleReport } from "@/lib/replay-lab/report";

type Props = {
  report: ReplayAccessibleReport;
  /** One-event-at-a-time mode for reduced cognitive load. */
  oneEventAtATime?: boolean;
  focusEventIndex?: number;
};

/**
 * Text-first authoritative timeline. A graphical timeline is optional and not required.
 */
export function ReplayLabTimeline({
  report,
  oneEventAtATime = false,
  focusEventIndex = 0,
}: Props) {
  const events = oneEventAtATime
    ? report.events.slice(Math.max(0, focusEventIndex), Math.max(0, focusEventIndex) + 1)
    : report.events;

  return (
    <div className="space-y-8 text-[#0C1833]">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
          Synthetic simulation — not a production claim
        </p>
        <h2 className="text-2xl font-bold tracking-tight">{report.title}</h2>
        <p className="text-sm text-slate-600">{report.summary}</p>
        <p className="text-xs text-slate-500">{report.watermark}</p>
      </header>

      <section aria-labelledby="replay-events-heading">
        <h3 id="replay-events-heading" className="text-lg font-semibold">
          Event list (authoritative)
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Structured events are the source of truth. A graph is not required.
        </p>
        <ol className="mt-4 list-decimal space-y-3 pl-5">
          {events.map((e) => (
            <li key={e.eventId} className="pl-1">
              <p className="font-medium">
                {e.localTime ? `${e.localTime} — ` : ""}
                <span className="font-mono text-sm">{e.eventType}</span>
              </p>
              <p className="text-sm text-slate-700">
                Actor: {e.sourceActor}. {e.detail}
              </p>
              <p className="text-xs text-slate-500">
                {e.eventId} · synthetic={String(e.synthetic)} · {e.virtualTimestamp}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="replay-actors-heading">
        <h3 id="replay-actors-heading" className="text-lg font-semibold">
          Actor states
        </h3>
        <table className="mt-3 w-full border-collapse text-left text-sm">
          <caption className="sr-only">Synthetic actors and authority scopes</caption>
          <thead>
            <tr className="border-b border-slate-300">
              <th scope="col" className="py-2 pr-3 font-semibold">
                Name
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold">
                Role
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold">
                Authority scopes
              </th>
              <th scope="col" className="py-2 font-semibold">
                Prohibited actions
              </th>
            </tr>
          </thead>
          <tbody>
            {report.actors.map((a) => (
              <tr key={a.id} className="border-b border-slate-200 align-top">
                <td className="py-2 pr-3">{a.displayName}</td>
                <td className="py-2 pr-3">{a.role}</td>
                <td className="py-2 pr-3">
                  {a.authorityScopes.length > 0 ? a.authorityScopes.join(", ") : "none (relationship ≠ authority)"}
                </td>
                <td className="py-2">{a.prohibitedActions.join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="replay-assertions-heading">
        <h3 id="replay-assertions-heading" className="text-lg font-semibold">
          Assertion report
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Multidimensional journey integrity — no bare universal score (
          {report.scorecard.universalScore === null ? "universalScore=null" : "error"}).
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
          {report.assertions.map((a) => (
            <li key={a.id}>
              <span className="font-medium">{a.id}</span>{" "}
              <span
                className={
                  a.state === "failed" || a.state === "blocked"
                    ? "text-red-800"
                    : a.state === "passed" || a.state === "passed_with_limitations"
                      ? "text-emerald-900"
                      : "text-amber-900"
                }
              >
                [{a.state}]
              </span>{" "}
              <span className="text-slate-600">({a.dimension})</span> — {a.detail}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
