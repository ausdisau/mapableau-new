import { GraphCardShell } from "@/components/mapable-graphs/GraphCardShell";

type BookingItem = {
  type: string;
  label: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  status?: string;
};

type Props = {
  careBooking?: BookingItem;
  transportBooking?: BookingItem;
  employmentEvent?: BookingItem;
  dependencies?: string[];
  warnings?: string[];
  risks?: string[];
};

export function BookingDependencyCard({
  careBooking,
  transportBooking,
  employmentEvent,
  dependencies = [],
  warnings = [],
  risks = [],
}: Props) {
  return (
    <GraphCardShell
      title="Booking connections"
      description="How your care, transport, and work times link together."
    >
      <dl className="grid gap-4 sm:grid-cols-1">
        {careBooking ? (
          <div>
            <dt className="font-semibold">Care</dt>
            <dd>
              {careBooking.label}
              {careBooking.scheduledEnd
                ? ` — ends ${formatTime(careBooking.scheduledEnd)}`
                : null}
            </dd>
          </div>
        ) : null}
        {transportBooking ? (
          <div>
            <dt className="font-semibold">Transport</dt>
            <dd>
              {transportBooking.label}
              {transportBooking.scheduledStart
                ? ` — pickup ${formatTime(transportBooking.scheduledStart)}`
                : null}
            </dd>
          </div>
        ) : null}
        {employmentEvent ? (
          <div>
            <dt className="font-semibold">Work</dt>
            <dd>
              {employmentEvent.label}
              {employmentEvent.scheduledStart
                ? ` — starts ${formatTime(employmentEvent.scheduledStart)}`
                : null}
            </dd>
          </div>
        ) : null}
      </dl>

      {dependencies.length > 0 ? (
        <section aria-labelledby="booking-deps-heading">
          <h3 id="booking-deps-heading" className="font-semibold">
            Dependencies
          </h3>
          <ul className="list-disc pl-6">
            {dependencies.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {warnings.length > 0 ? (
        <div role="alert" className="space-y-2">
          {warnings.map((w) => (
            <p
              key={w}
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3"
            >
              {w}
            </p>
          ))}
        </div>
      ) : null}

      {risks.length > 0 ? (
        <ul className="list-disc pl-6 text-sm text-muted-foreground">
          {risks.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
    </GraphCardShell>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
