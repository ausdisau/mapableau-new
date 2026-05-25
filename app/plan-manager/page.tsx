import { PlanManagerDashboard } from "@/components/plan-manager/PlanManagerDashboard";
import { requirePermission } from "@/lib/auth/guards";
import {
  listLinkedParticipants,
  listPlanManagerInvoices,
} from "@/lib/plan-manager/plan-manager-service";

export default async function PlanManagerHomePage() {
  const user = await requirePermission("plan_manager:portal");
  const [participants, invoices] = await Promise.all([
    listLinkedParticipants(user.id),
    listPlanManagerInvoices({
      planManagerId: user.id,
      actorRole: user.primaryRole,
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <h1 className="mb-6 font-heading text-2xl font-bold md:text-3xl">
        Plan manager portal
      </h1>
      <PlanManagerDashboard participants={participants} invoices={invoices} />
    </div>
  );
}
