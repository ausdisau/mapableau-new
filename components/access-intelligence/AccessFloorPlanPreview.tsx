import Link from "next/link";

export function AccessFloorPlanPreview({
  placeId,
  floorPlans,
}: {
  placeId: string;
  floorPlans: {
    id: string;
    title: string;
    levelLabel?: string | null;
    publicNotes?: string | null;
    markerCount: number;
  }[];
}) {
  if (!floorPlans.length) return null;

  return (
    <section
      aria-labelledby="access-intelligence-heading"
      className="rounded-lg border border-border p-4"
    >
      <h2 id="access-intelligence-heading" className="text-lg font-semibold">
        Access Intelligence floor plans
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Preview the venue layout and access markers before you arrive.
      </p>
      <div className="mt-3 grid gap-3">
        {floorPlans.map((floorPlan) => (
          <Link
            key={floorPlan.id}
            href={`/access/places/${placeId}/floor-plans/${floorPlan.id}`}
            className="block rounded-lg border border-border p-3 hover:bg-muted"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{floorPlan.title}</p>
                <p className="text-sm text-muted-foreground">
                  {floorPlan.levelLabel ?? "Venue floor plan"} ·{" "}
                  {floorPlan.markerCount} access marker
                  {floorPlan.markerCount === 1 ? "" : "s"}
                </p>
              </div>
              <span className="text-sm underline">Open plan</span>
            </div>
            {floorPlan.publicNotes ? (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {floorPlan.publicNotes}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
