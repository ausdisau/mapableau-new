import { SupportTicketReplyComposer } from "./SupportTicketReplyComposer";

type Ticket = {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  messages?: { id: string; body: string; isInternal: boolean }[];
};

export function SupportTicketDetail({ ticket }: { ticket: Ticket }) {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{ticket.title}</h1>
      <p className="text-muted-foreground">{ticket.description}</p>
      <section aria-label="Messages">
        <ul className="space-y-2">
          {(ticket.messages ?? []).map((m) => (
            <li key={m.id} className="rounded-lg border p-3 text-sm">
              {m.isInternal ? <span className="text-xs">Internal — </span> : null}
              {m.body}
            </li>
          ))}
        </ul>
      </section>
      <SupportTicketReplyComposer ticketId={ticket.id} />
    </div>
  );
}
