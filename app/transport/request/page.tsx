import Link from "next/link";
import { Suspense } from "react";

import { NewTransportTripForm } from "@/components/transport/NewTransportTripForm";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Request transport | MapAble Transport",
  description:
    "Request an accessible transport trip. Route estimates are advisory; funding is not implied.",
};

function TripFormFallback() {
  return (
    <p className="text-sm text-muted-foreground" role="status">
      Loading the request form…
    </p>
  );
}

/** Canonical participant request route (alias of dashboard book flow). */
export default async function TransportRequestPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <p>
        <Link
          href="/transport/dashboard"
          className="text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          ← Back to transport dashboard
        </Link>
      </p>
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Request accessible transport</h1>
        <p className="text-sm text-muted-foreground">
          Route estimates are advisory and are not a guarantee of timing or NDIS
          payment approval. A provider will assign a verified driver and vehicle
          that matches your access needs after eligibility checks pass.
        </p>
      </header>
      <Suspense fallback={<TripFormFallback />}>
        <NewTransportTripForm />
      </Suspense>
    </div>
  );
}
