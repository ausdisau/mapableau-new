import Link from "next/link";
import { notFound } from "next/navigation";

import { InvoiceTotalsTable } from "@/components/invoices/InvoiceTotalsTable";
import { ProviderInvoiceActions } from "@/components/invoices/ProviderInvoiceActions";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderInvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const user = await requireAuth();
  const { invoiceId } = await params;
  const orgs = await prisma.organisationMember.findMany({
    where: { userId: user.id },
  });

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organisationId: { in: orgs.map((o) => o.organisationId) },
    },
    include: {
      lines: true,
      booking: { select: { id: true, bookingType: true } },
      participant: { select: { name: true } },
    },
  });
  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      <Link href="/provider/invoices" className="text-sm underline">
        ← Invoices
      </Link>
      <h1 className="font-heading text-2xl font-bold">
        Invoice {invoice.invoiceNumber ?? invoice.id.slice(0, 8)}
      </h1>
      <p className="text-sm">Participant: {invoice.participant.name}</p>
      <StatusBadge status={invoice.status} />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th scope="col" className="p-2 text-left">
              Line item
            </th>
            <th scope="col" className="p-2 text-right">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line) => (
            <tr key={line.id} className="border-b">
              <td className="p-2">{line.description}</td>
              <td className="p-2 text-right">
                ${(line.totalAmountCents / 100).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <InvoiceTotalsTable
        subtotalCents={invoice.subtotalCents}
        taxCents={invoice.taxCents}
        totalCents={invoice.totalCents}
        ndisClaimableCents={invoice.ndisClaimableCents}
        participantGapCents={invoice.participantGapCents}
      />
      <ProviderInvoiceActions
        invoiceId={invoice.id}
        bookingId={invoice.bookingId}
        status={invoice.status}
      />
    </div>
  );
}
