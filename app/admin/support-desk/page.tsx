import Link from "next/link";
import { redirect } from "next/navigation";

import { SupportTicketStatusBadge } from "@/components/support/SupportTicketStatusBadge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { isSafeguardingTicket } from "@/lib/support/ticket-service";
import { prisma } from "@/lib/prisma";

export default async function SupportDeskPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.primaryRole)) redirect("/dashboard");

  const [open, escalated] = await Promise.all([
    prisma.supportTicket.findMany({
      where: { status: { in: ["open", "triage", "waiting_on_user"] } },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: 50,
    }),
    prisma.supportTicket.findMany({
      where: { status: "escalated" },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Support desk</h1>
        <p className="text-slate-600 text-sm mt-1">
          Manage participant and provider support queues.
        </p>
      </header>

      <section aria-labelledby="escalated-heading">
        <h2 id="escalated-heading" className="font-semibold text-red-900">
          Escalated / safety
        </h2>
        {escalated.length === 0 ? (
          <p className="text-sm text-slate-600 mt-2">None escalated.</p>
        ) : (
          <TicketQueue tickets={escalated} />
        )}
      </section>

      <section aria-labelledby="open-heading">
        <h2 id="open-heading" className="font-semibold">
          Open queue
        </h2>
        <TicketQueue tickets={open} />
      </section>
    </div>
  );
}

function TicketQueue({
  tickets,
}: {
  tickets: Array<{
    id: string;
    title: string;
    status: string;
    category: string;
    requiresIncidentReview: boolean;
    priority: string;
  }>;
}) {
  if (tickets.length === 0) {
    return <p className="text-sm text-slate-600 mt-2">Queue empty.</p>;
  }
  return (
    <ul className="mt-2 space-y-2">
      {tickets.map((t) => (
        <li key={t.id}>
          <Link
            href={`/support/tickets/${t.id}`}
            className="flex flex-wrap justify-between gap-2 rounded-lg border bg-white p-3 hover:border-blue-300"
          >
            <span className="font-medium">{t.title}</span>
            <SupportTicketStatusBadge
              status={t.status}
              safeguarding={isSafeguardingTicket(t)}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
