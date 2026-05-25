import { InvoiceDashboard } from "@/components/admin-panels/provider/InvoiceDashboard";
import { requireProviderPanel } from "@/lib/auth/panel-guards";
import { listProviderInvoices } from "@/lib/invoices/invoice-panel-service";
import { resolveProviderOrganisationId } from "@/lib/providers/provider-service";

export const metadata = { title: "Invoices | Provider admin" };

export default async function ProviderInvoicesPage() {
  const user = await requireProviderPanel();
  const orgId = await resolveProviderOrganisationId(user);
  const invoices = await listProviderInvoices(user, orgId);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Invoices</h1>
      <InvoiceDashboard invoices={invoices} />
    </div>
  );
}
