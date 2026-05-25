import { FoodInvoicePanel } from "@/components/foods/FoodInvoicePanel";
import { requirePermission } from "@/lib/auth/guards";
import { listPlanManagerInvoices } from "@/lib/foods/plan-manager-service";

export default async function PlanManagerFoodInvoicesPage() {
  const user = await requirePermission("foods:invoice:read");
  const invoices = await listPlanManagerInvoices(user);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Food invoices</h1>
      <p className="text-sm text-amber-800">NDIS: review required — not automatically claimable.</p>
      <ul className="space-y-4">
        {invoices.map((inv) => (
          <li key={inv.id} className="rounded-lg border p-4">
            <p>Order {inv.orderId.slice(0, 8)}</p>
            <p className="text-sm text-muted-foreground">
              Status: {inv.ndisReviewStatus} — Xero: {inv.xeroSyncStatus}
            </p>
          </li>
        ))}
      </ul>
      {invoices[0] ? (
        <FoodInvoicePanel
          lines={[
            { description: "Food items", amountCents: 0, costType: "food_item" },
            { description: "Delivery", amountCents: 0, costType: "delivery" },
          ]}
        />
      ) : null}
    </div>
  );
}
