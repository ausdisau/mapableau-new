import { AccessDestinationArrival } from "@/components/access/AccessDestinationArrival";
import { resolveDestinationByPlaceId } from "@/lib/gais/destination";
import { mapableGaisFlags } from "@/lib/config/mapable-gais";

export async function AccessPlaceArrivalSection({ placeId }: { placeId: string }) {
  // Destination resolution reads published AccessPlace only; gate on destination or public read.
  if (!mapableGaisFlags.destinationEnabled && !mapableGaisFlags.readEnabled) {
    return null;
  }

  const destination = await resolveDestinationByPlaceId(placeId);
  if (!destination) return null;

  return <AccessDestinationArrival destination={destination} />;
}
