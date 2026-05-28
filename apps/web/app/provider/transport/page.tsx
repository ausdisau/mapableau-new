import Link from "next/link";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderTransportPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const bookings = await prisma.transportBooking.findMany({
    where: { operatorOrganisationId: { in: orgIds } },
  });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Transport trips</h1>
      <ul>
        {bookings.map((b) => (
          <li key={b.id}>
            <Link href={`/provider/transport/${b.id}`}>{b.pickupAddress}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
