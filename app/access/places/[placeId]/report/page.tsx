import Link from "next/link";

import { AddAccessReportForm } from "@/components/access/AddAccessReportForm";
import { getPlaceById } from "@/lib/access-map/access-place-service";

export default async function AccessReportPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = await params;
  const place = await getPlaceById(placeId, true);
  if (!place) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p>Place not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header>
        <Link
          href={`/access/places/${placeId}`}
          className="text-sm underline"
        >
          ← Back to {place.name}
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Add access report</h1>
        <p className="text-sm text-muted-foreground">
          Share what you observed about access at this place. Use plain language
          and avoid legal claims.
        </p>
      </header>
      <AddAccessReportForm placeId={placeId} />
    </div>
  );
}
