import { InvoiceInboxTable } from "@/components/plan-manager/InvoiceInboxTable";
import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";
import { requirePermission } from "@/lib/auth/guards";
import { listPlanManagerInvoices } from "@/lib/plan-manager/plan-manager-service";

export default async function PlanManagerInvoicesPage() {
  const user = await requirePermission("plan_manager:portal");
  const invoices = await listPlanManagerInvoices({
    planManagerId: user.id,
    actorRole: user.primaryRole,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <h1 className="font-heading text-2xl font-bold">Invoice inbox</h1>
      <MapAbleCard description="Linked participant invoices only">
        <InvoiceInboxTable invoices={invoices} />
      </MapAbleCard>
    </div>
  );
}
