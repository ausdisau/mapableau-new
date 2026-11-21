import { z } from "zod";

/**
 * Canonical mobility requirements for transport trips, eligibility, and UI.
 * Snapshot on trip create; may originate from AccessibilityProfile.transportRequirements.
 */
export const mobilityRequirementsSchema = z
  .object({
    requiresWheelchairAccessible: z.boolean().optional(),
    canTransferFromWheelchair: z.boolean().optional(),
    requiresRamp: z.boolean().optional(),
    requiresHoist: z.boolean().optional(),
    requiresLift: z.boolean().optional(),
    requiresAccessEquipment: z.boolean().optional(),
    assistanceAnimalPresent: z.boolean().optional(),
    driverAssistanceRequired: z.boolean().optional(),
    needsDriverAssistanceToDoor: z.boolean().optional(),
    needsExtraBoardingTime: z.boolean().optional(),
    passengerCount: z.number().int().min(1).max(8).optional(),
    /** Wheelchair securement spaces required for this trip (default 1 when wheelchair accessible). */
    wheelchairSecurementRequired: z.number().int().min(0).max(4).optional(),
    /** Independent pooling consent — required before attaching to a RideRun. */
    poolingAccepted: z.boolean().optional(),
    /** Optional equipment envelope (mm) for combined fit checks. */
    equipmentLengthMm: z.number().int().positive().optional(),
    equipmentWidthMm: z.number().int().positive().optional(),
    equipmentHeightMm: z.number().int().positive().optional(),
    mobilityAidNotes: z.string().max(2000).optional(),
    pickupNotes: z.string().max(2000).optional(),
    dropoffNotes: z.string().max(2000).optional(),
  })
  .partial();

export type MobilityRequirements = z.infer<typeof mobilityRequirementsSchema>;

export function parseMobilityRequirements(
  input: unknown
): MobilityRequirements {
  if (!input || typeof input !== "object") return {};
  const parsed = mobilityRequirementsSchema.safeParse(input);
  return parsed.success ? parsed.data : {};
}

export function normalizeMobilityRequirements(
  input: MobilityRequirements
): MobilityRequirements {
  const out: MobilityRequirements = { ...input };
  if (out.requiresWheelchairAccessible && !out.requiresRamp && !out.requiresLift) {
    out.requiresRamp = true;
  }
  if (out.needsDriverAssistanceToDoor && out.driverAssistanceRequired === undefined) {
    out.driverAssistanceRequired = true;
  }
  return out;
}

/** Map accessibility profile transportRequirements → trip mobility snapshot */
export function mobilityFromAccessibilityProfile(profile: {
  transportRequirements?: Record<string, unknown> | null;
  mobilityNeeds?: string[] | null;
}): MobilityRequirements {
  const tr = (profile.transportRequirements ?? {}) as Record<string, unknown>;
  const needs = profile.mobilityNeeds ?? [];
  const reqs: MobilityRequirements = {
    requiresWheelchairAccessible:
      tr.requiresWheelchairAccessibleVehicle === true
        ? true
        : undefined,
    canTransferFromWheelchair:
      tr.canTransferFromWheelchair === true ? true : undefined,
    requiresRamp: tr.requiresRamp === true ? true : undefined,
    requiresHoist: tr.requiresHoist === true ? true : undefined,
    driverAssistanceRequired:
      tr.needsDriverAssistanceToDoor === true ? true : undefined,
    needsDriverAssistanceToDoor:
      tr.needsDriverAssistanceToDoor === true ? true : undefined,
    needsExtraBoardingTime:
      tr.needsExtraBoardingTime === true ? true : undefined,
    assistanceAnimalPresent:
      tr.assistanceAnimalPresent === true ||
      needs.includes("assistance_animal")
        ? true
        : undefined,
    pickupNotes:
      typeof tr.pickupNotes === "string" ? tr.pickupNotes : undefined,
    dropoffNotes:
      typeof tr.dropoffNotes === "string" ? tr.dropoffNotes : undefined,
  };
  if (
    needs.some((m) =>
      ["manual_wheelchair", "power_wheelchair", "mobility_scooter"].includes(m)
    )
  ) {
    reqs.requiresWheelchairAccessible = true;
  }
  return normalizeMobilityRequirements(reqs);
}

export const MOBILITY_FIELD_LABELS: Record<keyof MobilityRequirements, string> = {
  requiresWheelchairAccessible: "Wheelchair-accessible vehicle",
  canTransferFromWheelchair: "Can transfer from wheelchair",
  requiresRamp: "Ramp access",
  requiresHoist: "Hoist required",
  requiresLift: "Lift required",
  requiresAccessEquipment: "Verified access equipment",
  assistanceAnimalPresent: "Assistance animal",
  driverAssistanceRequired: "Driver assistance",
  needsDriverAssistanceToDoor: "Assistance to door",
  needsExtraBoardingTime: "Extra boarding time",
  passengerCount: "Passengers",
  wheelchairSecurementRequired: "Wheelchair securement spaces",
  poolingAccepted: "Pooling consent",
  equipmentLengthMm: "Equipment length (mm)",
  equipmentWidthMm: "Equipment width (mm)",
  equipmentHeightMm: "Equipment height (mm)",
  mobilityAidNotes: "Mobility notes",
  pickupNotes: "Pickup notes",
  dropoffNotes: "Drop-off notes",
};

const BOOLEAN_REQUIREMENT_KEYS = [
  "requiresWheelchairAccessible",
  "requiresRamp",
  "requiresHoist",
  "requiresLift",
  "requiresAccessEquipment",
  "assistanceAnimalPresent",
  "driverAssistanceRequired",
  "needsDriverAssistanceToDoor",
  "needsExtraBoardingTime",
] as const satisfies ReadonlyArray<keyof MobilityRequirements>;

/**
 * Strictest combined mobility for group rides: OR boolean needs, max numeric capacity fields.
 * Never use object-spread — later false/undefined must not erase earlier true requirements.
 */
export function mergeMobilityRequirementsStrictest(
  ...inputs: MobilityRequirements[]
): MobilityRequirements {
  const out: MobilityRequirements = {};
  for (const input of inputs) {
    for (const key of BOOLEAN_REQUIREMENT_KEYS) {
      if (input[key] === true) {
        out[key] = true;
      }
    }
    if (typeof input.passengerCount === "number") {
      out.passengerCount = Math.max(out.passengerCount ?? 0, input.passengerCount);
    }
    if (typeof input.wheelchairSecurementRequired === "number") {
      out.wheelchairSecurementRequired = Math.max(
        out.wheelchairSecurementRequired ?? 0,
        input.wheelchairSecurementRequired
      );
    }
    for (const dim of [
      "equipmentLengthMm",
      "equipmentWidthMm",
      "equipmentHeightMm",
    ] as const) {
      if (typeof input[dim] === "number") {
        out[dim] = Math.max(out[dim] ?? 0, input[dim]!);
      }
    }
    if (input.canTransferFromWheelchair === false) {
      out.canTransferFromWheelchair = false;
    } else if (
      input.canTransferFromWheelchair === true &&
      out.canTransferFromWheelchair !== false
    ) {
      out.canTransferFromWheelchair = true;
    }
    // poolingAccepted is per-trip — never merge into a shared "all accepted" flag here.
  }
  return normalizeMobilityRequirements(out);
}

export function passengerCountOf(m: MobilityRequirements): number {
  return typeof m.passengerCount === "number" && m.passengerCount > 0
    ? m.passengerCount
    : 1;
}

export function wheelchairSecurementDemandOf(m: MobilityRequirements): number {
  if (typeof m.wheelchairSecurementRequired === "number") {
    return m.wheelchairSecurementRequired;
  }
  if (m.requiresWheelchairAccessible && m.canTransferFromWheelchair !== true) {
    return 1;
  }
  return 0;
}

/** Extra boarding buffer minutes when any passenger needs extra boarding time. */
export const EXTRA_BOARDING_BUFFER_MINUTES = 15;
