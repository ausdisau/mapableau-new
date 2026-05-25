import { InvoiceApprovalPanel } from "@/components/admin-panels/participant/InvoiceApprovalPanel";
import { requireParticipantPanel } from "@/lib/auth/panel-guards";
import { listParticipantInvoices } from "@/lib/invoices/invoice-panel-service";

export const metadata = { title: "Invoices | Participant admin" };

export default async function ParticipantInvoicesPage() {
  const user = await requireParticipantPanel();
  const invoices = await listParticipantInvoices(user);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Invoices</h1>
      <InvoiceApprovalPanel invoices={invoices} />
    </div>
  );
}
