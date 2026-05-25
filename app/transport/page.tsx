import Link from "next/link";

export default function TransportHubPage() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-heading text-3xl font-bold">Accessible transport</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Request disability-aware transport, track your trip, confirm completion, and report
          safety issues. Pricing shown is a placeholder until NDIS Pricing Intelligence is
          connected.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/transport/book"
          className="rounded-xl border p-6 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h3 className="font-heading text-lg font-semibold">Book transport</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Submit a new trip request with access needs.
          </p>
        </Link>
        <Link
          href="/transport/trips"
          className="rounded-xl border p-6 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h3 className="font-heading text-lg font-semibold">My trips</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            View status, maps, and confirm or dispute completed trips.
          </p>
        </Link>
      </div>
    </div>
  );
}
