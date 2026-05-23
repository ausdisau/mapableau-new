import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderInvoicesPage() {
  const user = await requireAuth();
  const orgs = await prisma.organisationMember.findMany({
    where: { userId: user.id },
  });
  const invoices = await prisma.invoice.findMany({
    where: {
      organisationId: { in: orgs.map((o) => o.organisationId) },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Invoices</h1>
      <ul className="space-y-2">
        {invoices.map((i) => (
          <li key={i.id}>
            <Link
              href={`/provider/invoices/${i.id}`}
              className="flex justify-between rounded-lg border p-3"
            >
              <span>{i.invoiceNumber ?? i.id.slice(0, 8)}</span>
              <StatusBadge status={i.status} />
            </Link>
          </li>
        ))}
      </ul>
      {!invoices.length && (
        <p className="text-muted-foreground">No invoices yet.</p>
      )}
    </div>
  );
}
