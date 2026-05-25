import { AccessDeniedPanel } from "@/components/shared/MapAbleModuleUi";
import { InvoiceReviewPanel } from "@/components/plan-manager/InvoiceReviewPanel";
import { requirePermission } from "@/lib/auth/guards";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { getInvoiceForPlanManager } from "@/lib/plan-manager/plan-manager-service";

export default async function PlanManagerInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("plan_manager:portal");
  const { id } = await params;

  try {
    const data = await getInvoiceForPlanManager({
      invoiceId: id,
      planManagerId: user.id,
      actorRole: user.primaryRole,
    });

    return (
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <h1 className="mb-6 font-heading text-2xl font-bold">Invoice review</h1>
        <InvoiceReviewPanel
          invoiceId={id}
          invoice={data.invoice}
          claimWarnings={data.claimWarnings as string[]}
          serviceLogs={data.serviceLogs}
          payment={data.payment}
          disclaimer={data.disclaimer}
        />
      </div>
    );
  } catch {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <AccessDeniedPanel
          message={accessDeniedMessage("no_link")}
          nextSteps="Ask the participant to link you as their plan manager and grant consent."
        />
      </div>
    );
  }
}
