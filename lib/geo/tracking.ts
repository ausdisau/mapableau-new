import { geoConfig } from "@/lib/config/geo";
import { prisma } from "@/lib/prisma";

export async function recordTransportTrackingPing(params: {
  transportBookingId: string;
  lat: number;
  lng: number;
  driverProfileId?: string;
}) {
  if (!geoConfig.liveTrackingEnabled) {
    return { skipped: true };
  }

  return prisma.transportTrackingPing.create({
    data: {
      transportBookingId: params.transportBookingId,
      lat: params.lat,
      lng: params.lng,
      driverProfileId: params.driverProfileId,
    },
  });
}

export async function listRecentTrackingPings(
  transportBookingId: string,
  limit = 20,
) {
  return prisma.transportTrackingPing.findMany({
    where: { transportBookingId },
    orderBy: { recordedAt: "desc" },
    take: limit,
  });
}
