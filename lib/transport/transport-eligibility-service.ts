import type { TransportVerificationKind } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { parseMobilityRequirements } from "@/lib/transport/mobility-schema";
import type { EligibilityCheckResult } from "@/types/transport-scheduling";
import type { TransportEligibilitySnapshot } from "@/types/transport";

const DRIVER_REQUIRED: TransportVerificationKind[] = [
  "licence",
  "screening",
  "training",
];

const VEHICLE_REQUIRED: TransportVerificationKind[] = [
  "registration",
  "insurance",
  "inspection",
];

function reasonCode(kind: string, issue: "missing" | "expired" | "unfit"): string {
  return `${kind}_${issue}`.toUpperCase();
}

function checkVerifications(
  records: Array<{ kind: TransportVerificationKind; status: string; expiresAt: Date | null }>,
  required: TransportVerificationKind[]
): { reasons: string[]; reasonCodes: string[] } {
  const reasons: string[] = [];
  const reasonCodes: string[] = [];
  const now = new Date();
  for (const kind of required) {
    const rec = records.find((r) => r.kind === kind);
    if (!rec || rec.status !== "verified") {
      reasons.push(`${kind} is not verified`);
      reasonCodes.push(reasonCode(kind, "missing"));
      continue;
    }
    if (rec.expiresAt && rec.expiresAt < now) {
      reasons.push(`${kind} has expired`);
      reasonCodes.push(reasonCode(kind, "expired"));
    }
  }
  return { reasons, reasonCodes };
}

function withMeta(
  eligible: boolean,
  reasons: string[],
  reasonCodes: string[]
): EligibilityCheckResult {
  return {
    eligible,
    reasons,
    reasonCodes,
    checkedAt: new Date().toISOString(),
    dataFreshness: "live_db",
  };
}

export async function checkDriverEligibility(
  driverId: string,
  options?: { requireAccessTraining?: boolean }
): Promise<EligibilityCheckResult> {
  const driver = await prisma.transportDriver.findUnique({
    where: { id: driverId },
    include: { verifications: true },
  });
  if (!driver || !driver.active) {
    return withMeta(false, ["Driver not found or inactive"], ["DRIVER_INACTIVE"]);
  }

  const required = [...DRIVER_REQUIRED];
  if (options?.requireAccessTraining) required.push("training");

  const { reasons, reasonCodes } = checkVerifications(driver.verifications, required);
  return withMeta(reasons.length === 0, reasons, reasonCodes);
}

export async function checkVehicleEligibility(
  vehicleId: string,
  mobilityRequirements?: Record<string, unknown>
): Promise<EligibilityCheckResult> {
  const vehicle = await prisma.transportVehicle.findUnique({
    where: { id: vehicleId },
    include: { verifications: true, features: true },
  });
  if (!vehicle || !vehicle.active) {
    return withMeta(false, ["Vehicle not found or inactive"], ["VEHICLE_INACTIVE"]);
  }

  const { reasons, reasonCodes } = checkVerifications(
    vehicle.verifications,
    VEHICLE_REQUIRED
  );

  const reqs = parseMobilityRequirements(mobilityRequirements ?? {});
  const feature = vehicle.features[0];
  if (reqs.requiresWheelchairAccessible && feature && !feature.wheelchairAccessible) {
    reasons.push("Vehicle is not wheelchair accessible");
    reasonCodes.push("VEHICLE_NOT_WAV");
  }
  if (reqs.requiresRamp && feature && !feature.rampAvailable && !feature.liftAvailable) {
    reasons.push("Vehicle does not have ramp or lift");
    reasonCodes.push("VEHICLE_NO_RAMP_OR_LIFT");
  }
  if (reqs.requiresLift && feature && !feature.liftAvailable) {
    reasons.push("Vehicle does not have a lift");
    reasonCodes.push("VEHICLE_NO_LIFT");
  }
  if (reqs.requiresHoist && feature && !feature.hoistAvailable) {
    reasons.push("Vehicle does not have a hoist");
    reasonCodes.push("VEHICLE_NO_HOIST");
  }

  const equipment = vehicle.verifications.find((v) => v.kind === "access_equipment");
  if (reqs.requiresAccessEquipment && equipment?.status !== "verified") {
    reasons.push("Access equipment verification missing");
    reasonCodes.push("ACCESS_EQUIPMENT_MISSING");
  }
  if (
    reqs.assistanceAnimalPresent &&
    feature &&
    !feature.assistanceAnimalFriendly
  ) {
    reasons.push("Vehicle is not marked assistance-animal friendly");
    reasonCodes.push("VEHICLE_NOT_ASSISTANCE_ANIMAL_FRIENDLY");
  }

  return withMeta(reasons.length === 0, reasons, reasonCodes);
}

export async function checkDriverEligibilityForTrip(
  driverId: string,
  mobilityRequirements?: Record<string, unknown>
): Promise<EligibilityCheckResult> {
  const reqs = parseMobilityRequirements(mobilityRequirements ?? {});
  const requireTraining =
    reqs.driverAssistanceRequired ||
    reqs.needsDriverAssistanceToDoor ||
    reqs.requiresWheelchairAccessible ||
    reqs.requiresHoist;
  return checkDriverEligibility(driverId, {
    requireAccessTraining: requireTraining,
  });
}

/** Combined fail-closed decision used at assignment time. */
export async function evaluateAssignmentEligibility(input: {
  driverId: string;
  vehicleId: string;
  organisationId: string;
  mobilityRequirements?: Record<string, unknown>;
  requirePrestart?: boolean;
  tripId?: string;
}): Promise<TransportEligibilitySnapshot> {
  const driverResult = await checkDriverEligibilityForTrip(
    input.driverId,
    input.mobilityRequirements
  );
  const vehicleResult = await checkVehicleEligibility(
    input.vehicleId,
    input.mobilityRequirements
  );

  const reasons = [...driverResult.reasons, ...vehicleResult.reasons];
  const reasonCodes = [
    ...(driverResult.reasonCodes ?? []),
    ...(vehicleResult.reasonCodes ?? []),
  ];

  const driver = await prisma.transportDriver.findUnique({
    where: { id: input.driverId },
  });
  if (driver && driver.organisationId !== input.organisationId) {
    reasons.push("Driver is not a member of this operator organisation");
    reasonCodes.push("DRIVER_ORG_MISMATCH");
  }

  if (input.requirePrestart && input.tripId) {
    const prestart = await prisma.transportSafetyCheck.findFirst({
      where: { tripId: input.tripId, checkType: "pre_start", passed: true },
      orderBy: { createdAt: "desc" },
    });
    if (!prestart) {
      reasons.push("Passing prestart check is required before departure");
      reasonCodes.push("PRESTART_REQUIRED");
    }
  }

  const eligible = reasons.length === 0;
  return {
    eligible,
    reasons,
    reasonCodes,
    checkedAt: new Date().toISOString(),
    dataFreshness: "live_db",
    driverId: input.driverId,
    vehicleId: input.vehicleId,
  };
}

export async function assertDriverEligible(
  driverId: string,
  mobilityRequirements?: Record<string, unknown>
) {
  const result = await checkDriverEligibilityForTrip(driverId, mobilityRequirements);
  if (!result.eligible) {
    throw new TransportApiError("TRANSPORT_DRIVER_NOT_ELIGIBLE", undefined, result);
  }
}

export async function assertVehicleEligible(
  vehicleId: string,
  mobilityRequirements?: Record<string, unknown>
) {
  const result = await checkVehicleEligibility(vehicleId, mobilityRequirements);
  if (!result.eligible) {
    throw new TransportApiError("TRANSPORT_VEHICLE_NOT_ELIGIBLE", undefined, result);
  }
}
