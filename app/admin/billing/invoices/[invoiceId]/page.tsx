import { notFound } from "next/navigation";

import { AdminInvoiceDetailClient } from "@/components/billing/AdminInvoiceDetailClient";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/guards";
import { getInvoiceById } from "@/lib/billing-core/invoice-service";
import { mapableEyebrowBadgeClass, mapablePageContainerClass } from "@/lib/brand/styles";

export const metadata = {
  title: "Invoice detail | Admin billing | MapAble",
};

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  await requireAdmin();
  const { invoiceId } = await params;
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) notFound();

  return (
    <div className={mapablePageContainerClass}>
      <div className="mx-auto max-w-4xl py-8">
        <Badge variant="outline" className={mapableEyebrowBadgeClass}>
          Admin billing
        </Badge>
        <div className="mt-6">
          <AdminInvoiceDetailClient
            invoice={{
              id: invoice.id,
              status: invoice.status,
              adminApprovalStatus: invoice.adminApprovalStatus,
              serviceType: invoice.serviceType,
              totalCents: invoice.totalCents,
              currency: invoice.currency,
              createdAt: invoice.createdAt.toISOString(),
              dueAt: invoice.dueAt?.toISOString() ?? null,
              disputeReason: invoice.disputeReason,
              disputedAt: invoice.disputedAt?.toISOString() ?? null,
              anomalyFlags: invoice.anomalyFlags,
              user: invoice.user,
              provider: invoice.provider,
              lineItems: invoice.lineItems.map((li) => ({
                id: li.id,
                description: li.description,
                quantity: Number(li.quantity),
                unitAmountCents: li.unitAmountCents,
                totalCents: li.totalCents,
              })),
            }}
          />
        </div>
      </div>
    </div>
  );
}
