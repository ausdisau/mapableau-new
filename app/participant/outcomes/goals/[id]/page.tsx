import { notFound } from "next/navigation";

import { GoalProgressTimeline } from "@/components/outcomes/GoalProgressTimeline";
import { OutcomeCheckInForm } from "@/components/outcomes/OutcomeCheckInForm";
import { requireAuth } from "@/lib/auth/guards";
import { getOutcomeGoal } from "@/lib/outcomes/outcome-goal-service";

export default async function OutcomeGoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  let goal;
  try {
    goal = await getOutcomeGoal(id, user);
  } catch {
    notFound();
  }
  if (!goal) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">{goal.goalText}</h1>
      <GoalProgressTimeline checkins={goal.checkins} />
      <OutcomeCheckInForm goalId={goal.id} />
    </div>
  );
}
