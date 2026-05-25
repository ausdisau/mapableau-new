import { MapAbleCard, MapAbleStatusBadge } from "@/components/shared/MapAbleModuleUi";

export function ProjectMilestoneTracker({
  milestones,
}: {
  milestones: {
    id: string;
    title: string;
    status: string;
    sortOrder: number;
    dueDate?: Date | string | null;
  }[];
}) {
  return (
    <MapAbleCard title="Project milestones">
      <ol className="space-y-4">
        {milestones.map((m, i) => (
          <li key={m.id} className="flex gap-4 rounded-xl border p-4">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-semibold"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{m.title}</h3>
                <MapAbleStatusBadge
                  status={m.status === "completed" ? "milestone_completed" : m.status}
                />
              </div>
              {m.dueDate ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Due: {new Date(m.dueDate).toLocaleDateString()}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </MapAbleCard>
  );
}
