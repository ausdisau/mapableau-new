import Link from "next/link";

import { PageContainer } from "@/components/layout/PageContainer";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Invoices | MapAble" };

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const invoices = await prisma.invoice.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
    include: { organisation: { select: { name: true } } },
  });

  return (
    <PageContainer title="Invoices">
      <p className="text-sm text-slate-600 mb-6" role="note">
        Review charges in plain language. Approving here is not NDIS funding
        approval — it confirms you agree with the line items shown.
      </p>

      {invoices.length === 0 ? (
        <p role="status" className="text-slate-600">
          No invoices yet. Invoices appear after a service log is submitted.
        </p>
      ) : (
        <ul className="space-y-3">
          {invoices.map((inv) => (
            <li key={inv.id}>
              <Link
                href={`/invoices/${inv.id}`}
                className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-200 bg-white p-4 min-h-11 hover:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <span>
                  <span className="font-medium block">
                    {inv.organisation?.name ?? "Invoice"}
                  </span>
                  <span className="text-sm text-slate-600">
                    ${(inv.totalCents / 100).toFixed(2)} AUD
                  </span>
                </span>
                <span className="text-sm font-medium text-slate-700 capitalize">
                  {statusLabel(inv.participantApprovalStatus)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
