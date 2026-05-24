import Link from "next/link";
import { notFound } from "next/navigation";

import { InvoiceDetail } from "@/components/invoices/InvoiceDetail";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { assertInvoiceAccess } from "@/lib/billing/invoice-access-service";
import { getInvoiceDetail } from "@/lib/billing/invoice-service";
import { mapablePageContainerClass } from "@/lib/brand/styles";

export const metadata = {
  title: "Invoice | MapAble",
};

export default async function InvoiceDetailPage({
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

  const viewerRole =
    invoice.participantId === user.id ? "participant" : "provider";

  return (
    <div className={mapablePageContainerClass}>
      <div className="mx-auto max-w-3xl py-8">
        <p className="mb-6 text-sm">
          <Link href="/invoices" className="text-primary hover:underline">
            ← All invoices
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
          viewerRole={viewerRole}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
