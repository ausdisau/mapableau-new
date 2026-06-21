import { notFound } from "next/navigation";

import { InvoiceReviewPanel } from "@/components/abilitypay/InvoiceReviewPanel";
import { getInvoiceById } from "@/lib/abilitypay/invoice-service";
import {
  canApproveInvoice,
  canViewInvoice,
} from "@/lib/abilitypay/policy";
import { requirePermission } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";

type PageProps = { params: Promise<{ id: string }> };

export default async function AbilityPayInvoiceDetailPage({
  params,
}: PageProps) {
  const user = await requirePermission("abilitypay:read");
  const { id } = await params;

  if (!(await canViewInvoice(user, id))) {
    notFound();
  }

  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">Review invoice</h1>
      </header>
      <InvoiceReviewPanel
        invoice={{
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          totalCents: invoice.totalCents,
          validationJson: invoice.validationJson,
          provider: invoice.provider,
          lineItems: invoice.lineItems,
          riskFlags: invoice.riskFlags,
        }}
        canApprove={canApproveInvoice(user)}
        showAiAssist={hasPermission(user.primaryRole, "abilitypay:invoice:review")}
      />
    </div>
  );
}
