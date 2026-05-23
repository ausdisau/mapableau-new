import type { TransportBooking } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const DAY_MAP: Record<number, string> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

function timeInWindow(time: string, start: string, end: string): boolean {
  return time >= start && time <= end;
}

export async function isDriverAvailable(
  driverProfileId: string,
  pickupStart: Date
): Promise<boolean> {
  const day = DAY_MAP[pickupStart.getDay()]!;
  const time = pickupStart.toISOString().slice(11, 16);
  const windows = await prisma.availabilityWindow.findMany({
    where: {
      driverProfileId,
      active: true,
      dayOfWeek: day as never,
    },
  });
  if (windows.length === 0) return true;
  return windows.some((w) => timeInWindow(time, w.startTime, w.endTime));
}

export async function isVehicleAvailable(
  vehicleId: string,
  pickupStart: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const conflict = await prisma.transportBooking.findFirst({
    where: {
      vehicleId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      status: {
        in: [
          "driver_assigned",
          "vehicle_dispatched",
          "arrived_at_pickup",
          "passenger_onboard",
        ],
      },
      pickupWindowStart: {
        gte: new Date(pickupStart.getTime() - 2 * 60 * 60 * 1000),
        lte: new Date(pickupStart.getTime() + 2 * 60 * 60 * 1000),
      },
    },
  });
  return !conflict;
}

export async function listAvailableFleet(organisationId: string, booking: Pick<TransportBooking, "pickupWindowStart" | "id">) {
  const [drivers, vehicles] = await Promise.all([
    prisma.driverProfile.findMany({
      where: { organisationId, active: true },
    }),
    prisma.vehicle.findMany({
      where: { organisationId, active: true },
    }),
  ]);

  const availableDrivers = [];
  for (const d of drivers) {
    if (await isDriverAvailable(d.id, booking.pickupWindowStart)) {
      availableDrivers.push(d);
    }
  }

  const availableVehicles = [];
  for (const v of vehicles) {
    if (await isVehicleAvailable(v.id, booking.pickupWindowStart, booking.id)) {
      availableVehicles.push(v);
    }
  }

  return { drivers: availableDrivers, vehicles: availableVehicles };
}
