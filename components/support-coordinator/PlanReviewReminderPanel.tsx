import { MapAbleCard, MapAbleStatusBadge } from "@/components/shared/MapAbleModuleUi";

type Reminder = {
  id: string;
  title: string;
  reviewDate: string | Date;
  status: string;
  notes?: string | null;
};

export function PlanReviewReminderPanel({ reminders }: { reminders: Reminder[] }) {
  return (
    <MapAbleCard title="Plan review reminders">
      {reminders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming plan reviews.</p>
      ) : (
        <ul className="space-y-3">
          {reminders.map((r) => (
            <li key={r.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">{r.title}</h3>
                <MapAbleStatusBadge status={r.status} />
              </div>
              <p className="mt-1 text-sm">
                Review date: {new Date(r.reviewDate).toLocaleDateString()}
              </p>
              {r.notes ? (
                <p className="mt-1 text-sm text-muted-foreground">{r.notes}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </MapAbleCard>
  );
}
