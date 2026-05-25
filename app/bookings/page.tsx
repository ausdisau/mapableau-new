import Link from "next/link";

import { BookingStatusPanel } from "@/components/bookings/BookingTimeline";
import { PageContainer } from "@/components/layout/PageContainer";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Bookings | MapAble" };

export default async function BookingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const bookings = await prisma.booking.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      assignedOrganisation: { select: { name: true } },
    },
  });

  return (
    <PageContainer title="Bookings">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <p className="text-slate-600 text-sm">
          Request care or transport. Providers respond when they are booking
          eligible.
        </p>
        <Link
          href="/bookings/new"
          className="inline-flex min-h-11 items-center rounded-md bg-blue-700 px-4 text-white font-medium focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          New booking request
        </Link>
      </header>

      {bookings.length === 0 ? (
        <p role="status" className="text-slate-600">
          You have no bookings yet.{" "}
          <Link href="/providers" className="text-blue-800 font-medium">
            Find a provider
          </Link>{" "}
          to get started.
        </p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/bookings/${b.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-600 min-h-11"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium capitalize">
                    {b.bookingType.replace("_", " + ")}
                    {b.assignedOrganisation
                      ? ` — ${b.assignedOrganisation.name}`
                      : ""}
                  </span>
                  <BookingStatusPanel status={b.status} />
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {new Date(b.requestedStart).toLocaleString("en-AU")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
