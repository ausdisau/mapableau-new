import {
  checkVerificationRecords,
  FLEET_DRIVER_VERIFICATION_KINDS,
  FLEET_VEHICLE_VERIFICATION_KINDS,
} from "@/lib/transport/transport-fleet-verification";
import { prisma } from "@/lib/prisma";

/** Active fleet members missing or with expired required verifications. */
export async function countTransportFleetVerificationIssues(): Promise<number> {
  const [vehicles, drivers] = await Promise.all([
    prisma.transportVehicle.findMany({
      where: { active: true },
      include: { verifications: true },
    }),
    prisma.transportDriver.findMany({
      where: { active: true },
      include: { verifications: true },
    }),
  ]);

  let count = 0;
  for (const v of vehicles) {
    if (
      checkVerificationRecords(v.verifications, FLEET_VEHICLE_VERIFICATION_KINDS)
        .length > 0
    ) {
      count += 1;
    }
  }
  for (const d of drivers) {
    if (
      checkVerificationRecords(d.verifications, FLEET_DRIVER_VERIFICATION_KINDS)
        .length > 0
    ) {
      count += 1;
    }
  }
  return count;
}
