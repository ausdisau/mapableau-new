import Link from "next/link";

export function GoalCard({
  goal,
}: {
  goal: { id: string; goalText: string; status: string; goalArea: string | null };
}) {
  return (
    <Link
      href={`/participant/outcomes/goals/${goal.id}`}
      className="block rounded-xl border p-4 hover:bg-muted/40"
    >
      <h2 className="font-medium">{goal.goalText}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {goal.goalArea ?? "General"} · {goal.status}
      </p>
    </Link>
  );
}
