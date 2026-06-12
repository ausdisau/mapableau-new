import { InvoiceInbox } from "@/components/abilitypay/InvoiceInbox";
import { listInvoicesForUser } from "@/lib/abilitypay/invoice-service";
import { requirePermission } from "@/lib/auth/guards";

export default async function AbilityPayInvoicesPage() {
  const user = await requirePermission("abilitypay:read");
  const invoices = await listInvoicesForUser(user.id, user.primaryRole);

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">Invoices</h1>
        <p className="text-muted-foreground">
          Review invoices from your providers before approving payment.
        </p>
      </header>
      <InvoiceInbox invoices={invoices} />
    </div>
  );
}
