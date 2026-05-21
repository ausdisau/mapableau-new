import { AdminBillingClient } from "@/components/billing/AdminBillingClient";

export const metadata = {
  title: "Admin billing | MapAble",
};

export default function AdminBillingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Billing console</h1>
      <p className="mt-2 text-muted-foreground">
        Search invoices, review failed payments, disputes, and export errors.
      </p>
      <div className="mt-8">
        <AdminBillingClient />
      </div>
    </div>
  );
}
