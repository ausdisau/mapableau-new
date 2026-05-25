import { GoalCard } from "./GoalCard";

export function OutcomesDashboard({
  goals,
}: {
  goals: { id: string; goalText: string; status: string; goalArea: string | null }[];
}) {
  if (!goals.length) {
    return (
      <p className="text-muted-foreground">
        Add goals in your own words — there are no required star ratings.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {goals.map((g) => (
        <li key={g.id}>
          <GoalCard goal={g} />
        </li>
      ))}
    </ul>
  );
}
