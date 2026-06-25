import Link from "next/link";

export function VenueClaimStatusBanner({
  claimedByVenue,
  placeId,
}: {
  claimedByVenue: boolean;
  placeId: string;
}) {
  if (claimedByVenue) {
    return (
      <div
        className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
        role="status"
      >
        This venue has claimed this listing and may provide official access
        information.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm">
      <p>Are you the venue owner?</p>
      <Link
        href={`/access/places/${placeId}/claim`}
        className="mt-1 inline-block underline"
      >
        Claim this listing
      </Link>
    </div>
  );
}
