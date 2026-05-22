import { requireAdmin } from "@/lib/auth/guards";
import { getReconciliationDashboard } from "@/lib/payment-reconciliation/reconciliation-service";

export default async function PaymentReconciliationPage() {
  await requireAdmin();
  const { batches } = await getReconciliationDashboard();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Payment reconciliation</h1>
      <p className="text-muted-foreground">
        Match Stripe payments, Xero invoices and MapAble records. Unmatched items
        require review.
      </p>
      {batches.map((b) => (
        <section key={b.id} className="rounded-lg border p-4">
          <h2 className="font-medium">
            Batch {b.createdAt.toLocaleDateString("en-AU")} — {b.status}
          </h2>
          <ul className="mt-2 text-sm">
            {b.exceptions.map((e) => (
              <li key={e.id}>
                {e.matchStatus} — invoice {e.invoiceId?.slice(0, 8) ?? "n/a"}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
