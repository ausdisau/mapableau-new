import Link from "next/link";

import { SupportTicketStatusBadge } from "@/components/support/SupportTicketStatusBadge";
import { PageContainer } from "@/components/layout/PageContainer";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSafeguardingTicket } from "@/lib/support/ticket-service";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/auth/roles";

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const tickets = await prisma.supportTicket.findMany({
    where: isAdminRole(user.primaryRole)
      ? {}
      : {
          OR: [{ createdById: user.id }, { participantId: user.id }],
        },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <PageContainer title="Support">
      <header className="flex flex-wrap justify-between gap-4 mb-6">
        <p className="text-sm text-slate-600">
          Get help with bookings, billing, accessibility, or safety concerns.
        </p>
        <Link
          href="/support/tickets/new"
          className="min-h-11 inline-flex items-center px-4 rounded-md bg-blue-700 text-white font-medium"
        >
          New ticket
        </Link>
      </header>

      {tickets.length === 0 ? (
        <p role="status" className="text-slate-600">
          No support tickets yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link
                href={`/support/tickets/${t.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-300 min-h-11"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{t.title}</span>
                  <SupportTicketStatusBadge
                    status={t.status}
                    safeguarding={isSafeguardingTicket(t)}
                  />
                </div>
                <p className="text-sm text-slate-600 mt-1 capitalize">
                  {t.category.replace(/_/g, " ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
