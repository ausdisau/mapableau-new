import Link from "next/link";
import { notFound } from "next/navigation";

import { InvoiceApprovalPanel } from "@/components/invoices/InvoiceApprovalPanel";
import { PageContainer } from "@/components/layout/PageContainer";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, participantId: user.id },
    include: {
      lines: true,
      organisation: { select: { name: true } },
    },
  });

  if (!invoice) notFound();

  const canApprove =
    invoice.participantApprovalStatus === "awaiting_participant_approval";

  return (
    <PageContainer title="Invoice review">
      <Link href="/invoices" className="text-sm text-blue-800 font-medium mb-4 inline-block">
        ← Back to invoices
      </Link>

      <p className="text-sm text-slate-600 mb-4">
        {invoice.organisation?.name ?? "Provider"} — issued{" "}
        {invoice.issueDate
          ? new Date(invoice.issueDate).toLocaleDateString("en-AU")
          : "pending"}
      </p>

      <ul className="space-y-3 mb-6">
        {invoice.lines.map((line) => (
          <li
            key={line.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <p className="font-medium">{line.description}</p>
            <p className="text-sm text-slate-600 mt-1">
              {new Date(line.serviceDate).toLocaleDateString("en-AU")} — $
              {(line.totalAmountCents / 100).toFixed(2)}
            </p>
            {line.supportItemCode ? (
              <p className="text-xs text-slate-500 mt-1">
                Support item: {line.supportItemCode}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="text-lg font-semibold mb-4">
        Total: ${(invoice.totalCents / 100).toFixed(2)} AUD
      </p>

      {invoice.notes ? (
        <p className="text-sm text-slate-700 mb-6">{invoice.notes}</p>
      ) : null}

      <InvoiceApprovalPanel invoiceId={invoice.id} canApprove={canApprove} />
    </PageContainer>
  );
}
