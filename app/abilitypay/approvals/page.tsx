import { InvoiceInbox } from "@/components/abilitypay/InvoiceInbox";
import { listPendingApprovals } from "@/lib/abilitypay/invoice-service";
import { requirePermission } from "@/lib/auth/guards";

export default async function AbilityPayApprovalsPage() {
  const user = await requirePermission("abilitypay:invoice:approve");
  const invoices = await listPendingApprovals(user.id);

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">Approvals</h1>
        <p className="text-muted-foreground">
          Invoices waiting for your decision. Only you can approve or reject.
        </p>
      </header>
      <InvoiceInbox invoices={invoices} />
    </div>
  );
}
