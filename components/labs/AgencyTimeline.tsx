import type { AgencyEvent } from "@/lib/labs/contracts";

const ACTOR_LABELS: Record<AgencyEvent["actor"], string> = {
  PARTICIPANT: "Participant",
  SYSTEM: "System",
  ENVIRONMENT: "Environment",
  SUPPORT_PERSON: "Support person",
};

export function AgencyTimeline({ events }: { events: AgencyEvent[] }) {
  return (
    <section
      className="rounded-3xl border border-white/10 bg-white/[0.045] p-5"
      aria-labelledby="agency-timeline-heading"
    >
      <h2 id="agency-timeline-heading" className="text-xl font-black">
        Agency Timeline
      </h2>
      <p className="mt-2 text-sm text-white/65">
        Simulation record of who acted and who held authority. Not real-world telemetry.
      </p>
      {events.length === 0 ? (
        <p className="mt-4 text-sm text-white/55">No events yet. Start the journey to begin.</p>
      ) : (
        <ol className="mt-4 space-y-3" aria-label="Agency events">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-2xl border border-white/10 px-4 py-3"
            >
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#F8C51C]">
                {ACTOR_LABELS[event.actor]} · {event.authorityState.replace(/_/g, " ")}
              </p>
              <p className="mt-1 font-semibold text-white">{event.action}</p>
              <p className="mt-1 text-xs text-white/50">
                <time dateTime={event.timestamp}>
                  {new Date(event.timestamp).toLocaleString("en-AU")}
                </time>
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
