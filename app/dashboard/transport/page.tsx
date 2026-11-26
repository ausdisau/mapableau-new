import Link from "next/link";

import { TransportTripListItem } from "@/components/transport/TransportTripListItem";
import { requireAuth } from "@/lib/auth/guards";
import { listTransportTripCards } from "@/lib/transport/transport-trip-list";

export const metadata = { title: "Transport trips | MapAble Core" };

export default async function TransportTripsPage() {
  const user = await requireAuth();
  const trips = await listTransportTripCards(user).catch((error: unknown) => {
    // Log only a Prisma error code. Query text can contain private trip details.
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    console.error(
      "[transport] dashboard list unavailable",
      /^P\d{4}$/.test(code) ? code : "unknown",
    );
    return null;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Transport trips</h1>
          <p className="text-muted-foreground">
            Scheduled transport with plain-language status. Route estimates are
            advisory only. Live GPS tracking is not available in this pilot.
          </p>
        </div>
        <Link
          href="/transport/request"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Request transport
        </Link>
      </header>

      <nav
        aria-label="Transport tools"
        className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-primary"
      >
        <Link className="underline" href="/dashboard/find-transport">
          Find transport operators
        </Link>
        <Link className="underline" href="/transport/passenger">
          Practise a passenger trip
        </Link>
        <Link className="underline" href="/unified">
          MapAble Unified
        </Link>
      </nav>

      {trips === null ? (
        <section
          aria-labelledby="trips-unavailable"
          className="space-y-2 rounded-xl border border-border bg-card p-4"
        >
          <h2 id="trips-unavailable" className="font-semibold">
            Your trip list is temporarily unavailable
          </h2>
          <p>
            We couldn’t check your existing trips. Please check again before
            making another request.
          </p>
          <form action="/dashboard/transport" method="get">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center font-semibold text-primary underline"
            >
              Reload trip list
            </button>
          </form>
        </section>
      ) : trips.length === 0 ? (
        <p role="status">You have no transport trips yet.</p>
      ) : (
        <ul className="space-y-3">
          {trips.map((trip) => (
            <li key={trip.id}>
              <TransportTripListItem trip={trip} />
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-muted-foreground">
        <Link
          href="/dashboard/transport/legacy"
          className="font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          Older transport bookings
        </Link>{" "}
        from the previous booking flow.
      </p>
    </div>
  );
}
