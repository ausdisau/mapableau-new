import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Participants | Plan manager" };

export default async function PlanManagerParticipantsPage() {
  await requirePermission("plan_manager:portal");

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-bold">Participants</h1>
      <p className="text-sm text-muted-foreground">
        Participants linked to your plan management organisation appear here.
      </p>
    </div>
  );
}
