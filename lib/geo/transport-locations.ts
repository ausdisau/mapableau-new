import { prisma } from "@/lib/prisma";

export async function upsertTransportBookingLocation(params: {
  transportBookingId: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
}) {
  if (
    params.pickupLat == null ||
    params.pickupLng == null ||
    params.dropoffLat == null ||
    params.dropoffLng == null
  ) {
    return null;
  }

  await prisma.$executeRaw`
    INSERT INTO transport_booking_locations (
      transport_booking_id,
      pickup_point,
      dropoff_point,
      created_at,
      updated_at
    )
    VALUES (
      ${params.transportBookingId},
      ST_SetSRID(ST_MakePoint(${params.pickupLng}, ${params.pickupLat}), 4326)::geography,
      ST_SetSRID(ST_MakePoint(${params.dropoffLng}, ${params.dropoffLat}), 4326)::geography,
      NOW(),
      NOW()
    )
    ON CONFLICT (transport_booking_id)
    DO UPDATE SET
      pickup_point = EXCLUDED.pickup_point,
      dropoff_point = EXCLUDED.dropoff_point,
      updated_at = NOW()
  `;

  return { ok: true };
}

export async function nearbyTransportOperatorOrganisationIds(params: {
  lat: number;
  lng: number;
  radiusKm: number;
}) {
  const rows = await prisma.$queryRaw<Array<{ organisation_id: string }>>`
    SELECT DISTINCT organisation_id
    FROM transport_network_region_locations
    WHERE ST_DWithin(
      service_area,
      ST_SetSRID(ST_MakePoint(${params.lng}, ${params.lat}), 4326)::geography,
      ${params.radiusKm * 1000}
    )
  `;
  return rows.map((r) => r.organisation_id);
}
