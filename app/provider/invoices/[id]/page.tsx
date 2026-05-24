import Link from "next/link";
import { notFound } from "next/navigation";

import { InvoiceDetail } from "@/components/invoices/InvoiceDetail";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { assertInvoiceAccess } from "@/lib/billing/invoice-access-service";
import { getInvoiceDetail } from "@/lib/billing/invoice-service";
import { mapablePageContainerClass } from "@/lib/brand/styles";

export const metadata = {
  title: "Invoice | MapAble Provider",
};

export default async function ProviderInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCurrentUser();
  const { id } = await params;

  try {
    await assertInvoiceAccess(user, id);
  } catch {
    notFound();
  }

  const invoice = await getInvoiceDetail(user, id);
  if (!invoice) notFound();

  return (
    <div className={mapablePageContainerClass}>
      <div className="mx-auto max-w-3xl py-8">
        <p className="mb-6 text-sm">
          <Link href="/provider/invoices" className="text-primary hover:underline">
            ← Provider invoices
          </Link>
        </p>
        <InvoiceDetail
          invoice={{
            ...invoice,
            lines: invoice.lines.map((l) => ({
              ...l,
              serviceDate: l.serviceDate.toISOString(),
              quantity: Number(l.quantity),
            })),
          }}
          viewerRole="provider"
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
