import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function CareBookingsPage() {
  const user = await requirePermission("care:read:self");
  const bookings = await prisma.careBooking.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      organisation: { select: { name: true } },
      careRequest: { select: { title: true } },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">My care bookings</h1>
      <ul className="space-y-3">
        {bookings.map((b) => (
          <li key={b.id}>
            <Link
              href={`/care/bookings/${b.id}`}
              className="block rounded-xl border p-4 hover:bg-muted/50"
            >
              <span className="font-medium">{b.careRequest.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {b.organisation.name} · {b.status}
              </span>
            </Link>
          </li>
        ))}
        {bookings.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            No bookings yet.{" "}
            <Link href="/care/request" className="underline">
              Submit a care request
            </Link>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
