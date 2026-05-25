import Link from "next/link";

import type { ThreadContextLinks } from "@/types/messages";

function ContextCard({ title, href }: { title: string; href: string }) {
  return (
    <Link
      href={href}
      className="block min-h-11 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {title}
    </Link>
  );
}

export function ThreadContextCards({ context }: { context: ThreadContextLinks }) {
  const items = [
    context.booking,
    context.invoice,
    context.serviceAgreement,
    context.supportTicket,
    context.transportTrip,
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <section aria-label="Linked records" className="space-y-2">
      <h3 className="text-sm font-semibold">Linked to this chat</h3>
      <div className="space-y-2">
        {context.booking ? (
          <ContextCard title={context.booking.title} href={context.booking.href} />
        ) : null}
        {context.invoice ? (
          <ContextCard title={context.invoice.title} href={context.invoice.href} />
        ) : null}
        {context.serviceAgreement ? (
          <ContextCard
            title={context.serviceAgreement.title}
            href={context.serviceAgreement.href}
          />
        ) : null}
        {context.supportTicket ? (
          <ContextCard
            title={context.supportTicket.title}
            href={context.supportTicket.href}
          />
        ) : null}
        {context.transportTrip ? (
          <ContextCard
            title={context.transportTrip.title}
            href={context.transportTrip.href}
          />
        ) : null}
      </div>
    </section>
  );
}
