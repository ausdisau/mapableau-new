import { OutcomesDashboard } from "@/components/outcomes/OutcomesDashboard";
import { requireAuth } from "@/lib/auth/guards";
import { listOutcomeGoals } from "@/lib/outcomes/outcome-goal-service";

export default async function ParticipantOutcomesPage() {
  const user = await requireAuth();
  let goals: Awaited<ReturnType<typeof listOutcomeGoals>> = [];
  try {
    goals = await listOutcomeGoals(user.id, user);
  } catch {
    goals = [];
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Your goals</h1>
      <OutcomesDashboard goals={goals} />
    </div>
  );
}
