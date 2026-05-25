import Link from "next/link";
import { notFound } from "next/navigation";

import { SupportTicketDetail } from "@/components/support-desk/SupportTicketDetail";
import { prisma } from "@/lib/prisma";

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      comments: true,
      messages: { orderBy: { createdAt: "asc" } },
      tags: true,
      ticketEvents: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) notFound();

  return (
    <div className="space-y-4">
      <Link href="/admin/support-desk" className="text-sm text-primary underline">
        Back to queue
      </Link>
      <SupportTicketDetail ticket={ticket} />
    </div>
  );
}
