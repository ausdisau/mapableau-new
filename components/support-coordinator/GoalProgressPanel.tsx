import { MapAbleCard, MapAbleStatusBadge } from "@/components/shared/MapAbleModuleUi";

type Goal = {
  id: string;
  goalTitle: string;
  progressPct: number;
  status: string;
  notes?: string | null;
};

export function GoalProgressPanel({
  goals,
  consentActive,
}: {
  goals: Goal[];
  consentActive: boolean;
}) {
  if (!consentActive) {
    return (
      <MapAbleCard title="Goal progress">
        <p className="text-sm text-muted-foreground">
          Goals are hidden until consent is active.
        </p>
      </MapAbleCard>
    );
  }

  return (
    <MapAbleCard title="Goal progress" description="Track NDIS plan goals with the participant.">
      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No goals recorded yet.</p>
      ) : (
        <ul className="space-y-4">
          {goals.map((goal) => (
            <li key={goal.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">{goal.goalTitle}</h3>
                <MapAbleStatusBadge status={goal.status} />
              </div>
              <p className="mt-2 text-sm">Progress: {goal.progressPct}%</p>
              {goal.notes ? (
                <p className="mt-1 text-sm text-muted-foreground">{goal.notes}</p>
              ) : null}
              <div
                className="mt-3 h-2 rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={goal.progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${goal.goalTitle} progress`}
              >
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${goal.progressPct}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </MapAbleCard>
  );
}
