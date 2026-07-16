import type { TrafficAdvisory } from "@/types/tfnsw";

export function TransportTrafficAdvisory({
  advisory,
}: {
  advisory: TrafficAdvisory;
}) {
  return (
    <section
      aria-labelledby="traffic-advisory-heading"
      className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30"
    >
      <h2 id="traffic-advisory-heading" className="font-semibold">
        Road traffic advisory
      </h2>
      <p className="mt-1 text-sm">
        {advisory.hazardCount} open incident{advisory.hazardCount === 1 ? "" : "s"}{" "}
        reported near your route corridor.
      </p>
      {advisory.hazards.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-sm">
          {advisory.hazards.slice(0, 5).map((h, i) => (
            <li key={h.id ?? i}>
              {h.headline ?? h.category ?? "Incident"}
              {h.distanceMetres != null
                ? ` (${Math.round(h.distanceMetres)} m from route)`
                : null}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground" role="note">
        {advisory.disclaimer}
      </p>
    </section>
  );
}
