import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function InvoicesPage() {
  const user = await requireAuth();
  const invoices = await prisma.invoice.findMany({ where: { participantId: user.id }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Invoices</h1>
      <p className="text-sm text-muted-foreground">Invoice drafts for your records. Not NDIS claim submissions.</p>
      <ul>{invoices.map(i => <li key={i.id} className="mb-2"><Link href={`/dashboard/invoices/${i.id}`} className="flex justify-between rounded-lg border p-3"><span>Invoice {i.id.slice(0,8)}</span><StatusBadge status={i.status} /></Link></li>)}</ul>
    </div>
  );
}
