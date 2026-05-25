import Link from "next/link";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { SupportTicketReplyComposer } from "@/components/support/SupportTicketReplyComposer";
import { SupportTicketStatusBadge } from "@/components/support/SupportTicketStatusBadge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import {
  getSupportTicketForUser,
  isSafeguardingTicket,
} from "@/lib/support/ticket-service";

export default async function SupportTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { id } = await params;

  const ticket = await getSupportTicketForUser(
    id,
    user.id,
    isAdminRole(user.primaryRole)
  );
  if (!ticket) notFound();

  return (
    <PageContainer title={ticket.title}>
      <Link href="/support" className="text-sm text-blue-800 font-medium mb-4 inline-block">
        ← Support
      </Link>

      <SupportTicketStatusBadge
        status={ticket.status}
        safeguarding={isSafeguardingTicket(ticket)}
      />

      {isSafeguardingTicket(ticket) ? (
        <p className="mt-4 text-sm text-red-900 bg-red-50 border border-red-200 rounded-md p-3" role="alert">
          This ticket is flagged for safety review. If you are in immediate
          danger, call 000.
        </p>
      ) : null}

      <p className="mt-4 text-slate-800 whitespace-pre-wrap">{ticket.description}</p>

      <section className="mt-8" aria-labelledby="replies-heading">
        <h2 id="replies-heading" className="font-semibold">
          Replies
        </h2>
        {ticket.comments.length === 0 ? (
          <p className="text-sm text-slate-600 mt-2">No replies yet.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {ticket.comments.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <p className="text-xs text-slate-500">
                  {c.author.name} —{" "}
                  {new Date(c.createdAt).toLocaleString("en-AU")}
                </p>
                <p className="mt-1 text-sm">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SupportTicketReplyComposer ticketId={ticket.id} />
    </PageContainer>
  );
}
