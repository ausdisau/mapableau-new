import { AddAccessAlertForm } from "@/components/access/AddAccessAlertForm";
import { getPlaceById } from "@/lib/access-map/access-place-service";

export default async function NewAccessAlertPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = await params;
  const place = await getPlaceById(placeId, true);
  if (!place) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <p>Place not found.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <AddAccessAlertForm placeId={placeId} />
    </div>
  );
}
