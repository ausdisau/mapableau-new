import Link from "next/link";
import { notFound } from "next/navigation";

import { InvoiceTotalsTable } from "@/components/invoices/InvoiceTotalsTable";
import { ParticipantInvoiceActions } from "@/components/invoices/ParticipantInvoiceActions";
import { StatusBadge } from "@/components/ui/status-badge";
import { invoiceStatusLabel, toCoreInvoiceStatus } from "@/lib/domain/invoice-status";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ParticipantInvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const user = await requireAuth();
  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, participantId: user.id },
    include: {
      lines: true,
      organisation: { select: { name: true } },
      booking: {
        select: { id: true, bookingType: true, requestedStart: true },
      },
    },
  });
  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      <Link href="/dashboard/invoices" className="text-sm underline">
        ← Invoices
      </Link>
      <h1 className="font-heading text-2xl font-bold">
        Invoice {invoice.invoiceNumber ?? invoice.id.slice(0, 8)}
      </h1>
      <StatusBadge
        status={invoiceStatusLabel(toCoreInvoiceStatus(invoice.status))}
      />
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium">Provider</dt>
          <dd>{invoice.organisation?.name ?? "—"}</dd>
        </div>
        {invoice.booking && (
          <div>
            <dt className="font-medium">Service</dt>
            <dd>
              {invoice.booking.bookingType.replace("_", " + ")} on{" "}
              {new Date(invoice.booking.requestedStart).toLocaleDateString(
                "en-AU"
              )}
            </dd>
          </div>
        )}
      </dl>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th scope="col" className="p-2 text-left">
              Description
            </th>
            <th scope="col" className="p-2 text-right">
              Qty
            </th>
            <th scope="col" className="p-2 text-right">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line) => (
            <tr key={line.id} className="border-b">
              <td className="p-2">
                {line.description}
                {line.supportItemCode && (
                  <span className="block text-xs text-muted-foreground">
                    NDIS: {line.supportItemCode}
                  </span>
                )}
              </td>
              <td className="p-2 text-right">{String(line.quantity)}</td>
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
      <ParticipantInvoiceActions
        invoiceId={invoice.id}
        participantGapCents={invoice.participantGapCents}
        status={invoice.status}
      />
    </div>
  );
}
