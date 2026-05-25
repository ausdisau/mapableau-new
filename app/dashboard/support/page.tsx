import Link from "next/link";

import { SupportTicketStatusPanel } from "@/components/support/SupportTicketStatusPanel";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { isSafeguardingTicket } from "@/lib/support/ticket-service";

export const metadata = { title: "Support | MapAble" };

export default async function SupportPage() {
  const user = await requireAuth();
  const tickets = await prisma.supportTicket.findMany({
    where: { OR: [{ createdById: user.id }, { participantId: user.id }] },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <header className="flex justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold">Support</h1>
        <Link href="/dashboard/support/new" className="min-h-11 inline-flex items-center rounded-lg bg-primary px-4 text-primary-foreground">New ticket</Link>
      </header>
      <ul className="space-y-3">
        {tickets.map((t) => (
          <li key={t.id}>
            <Link href={`/dashboard/support/${t.id}`} className="block rounded-lg border border-border bg-card p-4">
              <h2 className="font-medium">{t.title}</h2>
              <SupportTicketStatusPanel status={t.status} priority={t.priority} isSafeguarding={isSafeguardingTicket(t)} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
