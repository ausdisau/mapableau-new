import Link from "next/link";

import { CoordinatorTaskList } from "@/components/care-support/CoordinatorTaskList";
import { requirePermission } from "@/lib/auth/guards";
import { listCoordinatorTasks } from "@/lib/care-support/coordinator-tasks";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function CoordinatorTasksPage() {
  await requirePermission("coordinator:portal");
  const user = await getCurrentUser();
  if (!user) return null;

  const tasks = await listCoordinatorTasks(user.id);

  return (
    <div className="space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Tasks</h1>
      <p className="text-muted-foreground">
        Open coordination tasks across your authorised participants.
      </p>
      <CoordinatorTaskList tasks={tasks} />
      <Link href="/support-coordinator" className="text-sm text-primary underline">
        Back to coordinator home
      </Link>
    </div>
  );
}
