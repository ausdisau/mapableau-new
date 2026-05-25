import Link from "next/link";

import { SupportTicketStatusBadge } from "./SupportTicketStatusBadge";

type Ticket = {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: Date;
};

export function SupportDeskQueue({ tickets }: { tickets: Ticket[] }) {
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Support ticket queue</caption>
      <thead>
        <tr className="border-b">
          <th className="py-2">Title</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Category</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((t) => (
          <tr key={t.id} className="border-b border-border/60">
            <td className="py-3">
              <Link href={`/admin/support-desk/tickets/${t.id}`} className="font-medium underline">
                {t.title}
              </Link>
            </td>
            <td>
              <SupportTicketStatusBadge status={t.status} />
            </td>
            <td>{t.priority}</td>
            <td>{t.category}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
