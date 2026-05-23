import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export default async function MapableCoreDemoPage() {
  if (process.env.NODE_ENV === "production") {
    const user = await requireAuth();
    if (!isAdminRole(user.primaryRole)) notFound();
  }

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      conversations: { include: { messages: { take: 3 } } },
      invoices: true,
      timelineEvents: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });

  const audit = await prisma.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    where: {
      OR: [
        { entityType: "Booking" },
        { entityType: "Invoice" },
        { entityType: "Conversation" },
      ],
    },
  });

  return (
    <main className="container space-y-8 py-8">
      <h1 className="font-heading text-2xl font-bold">MapAble Core demo</h1>
      <p className="text-sm text-muted-foreground">
        Development view of booking → messaging → invoicing lifecycle. Remove
        or protect this route before production.
      </p>
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/bookings/new" className="underline">
          New booking
        </Link>
        <Link href="/provider/bookings" className="underline">
          Provider bookings
        </Link>
        <Link href="/dashboard/messages" className="underline">
          Messages
        </Link>
        <Link href="/dashboard/invoices" className="underline">
          Invoices
        </Link>
        <Link href="/scheduling/new" className="underline">
          OSM scheduling
        </Link>
        <Link href="/provider/dispatch" className="underline">
          Provider dispatch map
        </Link>
        <Link href="/admin/dispatch" className="underline">
          Admin dispatch
        </Link>
      </nav>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Bookings</h2>
        <ul className="space-y-4">
          {bookings.map((b) => (
            <li key={b.id} className="rounded-lg border p-4 text-sm">
              <p>
                <strong>{b.bookingType}</strong> — {b.status} —{" "}
                {b.id.slice(0, 8)}
              </p>
              <p>
                Thread: {b.conversations[0]?.id?.slice(0, 8) ?? "none"} ·
                Messages: {b.conversations[0]?.messages.length ?? 0}
              </p>
              <p>
                Invoices:{" "}
                {b.invoices.map((i) => `${i.invoiceNumber ?? i.id} (${i.status})`).join(", ") ||
                  "none"}
              </p>
              <p className="text-muted-foreground">
                Timeline:{" "}
                {b.timelineEvents.map((e) => e.eventType).join(" → ")}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent audit events</h2>
        <ul className="space-y-1 text-sm font-mono">
          {audit.map((a) => (
            <li key={a.id}>
              {a.action} · {a.entityType} · {a.entityId?.slice(0, 8)}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
