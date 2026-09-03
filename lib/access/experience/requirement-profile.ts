import type { AccessNeed } from "@/lib/access/fit/types";

import type { AccessRequirementProfile } from "./types";
import { DEFAULT_ACCESS_REQUIREMENT_PROFILE } from "./types";

type MobilityAid =
  | "manual_wheelchair"
  | "power_wheelchair"
  | "mobility_scooter"
  | "walker"
  | "cane"
  | "prosthetic"
  | "assistance_animal"
  | "none"
  | "other";

type AccessibilityProfileShape = {
  mobilityNeeds?: MobilityAid[];
  communicationPreferences?: string[];
  sensoryPreferences?: Record<string, unknown>;
  transportRequirements?: {
    requiresWheelchairAccessibleVehicle?: boolean;
    requiresRamp?: boolean;
    assistanceAnimalPresent?: boolean;
    needsExtraBoardingTime?: boolean;
  };
  digitalPreferences?: {
    highContrast?: boolean;
    simpleLanguageMode?: boolean;
  };
};

/** Project functional requirements from dashboard AccessibilityProfile — never diagnosis. */
export function accessibilityProfileToRequirements(
  profile: AccessibilityProfileShape | null | undefined,
): AccessRequirementProfile {
  if (!profile) return { ...DEFAULT_ACCESS_REQUIREMENT_PROFILE };

  const mobility = profile.mobilityNeeds ?? [];
  const comms = profile.communicationPreferences ?? [];
  const transport = profile.transportRequirements ?? {};
  const digital = profile.digitalPreferences ?? {};
  const sensory = profile.sensoryPreferences ?? {};

  return {
    ...DEFAULT_ACCESS_REQUIREMENT_PROFILE,
    wheelchairUser: mobility.includes("manual_wheelchair"),
    powerchairUser: mobility.includes("power_wheelchair"),
    stepFreeRequired:
      mobility.includes("manual_wheelchair") ||
      mobility.includes("power_wheelchair") ||
      mobility.includes("mobility_scooter") ||
      Boolean(transport.requiresRamp),
    accessibleToiletRequired:
      mobility.includes("manual_wheelchair") ||
      mobility.includes("power_wheelchair"),
    assistanceAnimal:
      mobility.includes("assistance_animal") ||
      Boolean(transport.assistanceAnimalPresent),
    transportSupportNeeded: Boolean(
      transport.requiresWheelchairAccessibleVehicle ||
        transport.needsExtraBoardingTime,
    ),
    fatigueBufferNeeded: Boolean(transport.needsExtraBoardingTime),
    AuslanNeeded: comms.includes("auslan"),
    AACFriendlyNeeded: comms.includes("aac"),
    textCommunicationPreferred: comms.includes("written_only") || comms.includes("sms"),
    lowSensoryNeeded: Boolean(sensory.quietArea || sensory.lowStimulus),
    quietAreaPreferred: Boolean(sensory.quietArea),
    lowStimulusPreferred: Boolean(sensory.lowStimulus),
    highContrastSignagePreferred: Boolean(digital.highContrast),
    minimumDoorWidthMm: mobility.includes("power_wheelchair") ? 900 : 850,
  };
}

export function accessNeedToRequirementProfile(
  needs: AccessNeed,
): AccessRequirementProfile {
  return {
    ...DEFAULT_ACCESS_REQUIREMENT_PROFILE,
    ...needs,
    minimumDoorWidthMm: needs.powerchairUser
      ? 900
      : needs.wheelchairUser
        ? 850
        : null,
  };
}

export function countSelectedRequirements(
  profile: AccessRequirementProfile,
): number {
  const boolKeys: (keyof AccessNeed)[] = [
    "wheelchairUser",
    "powerchairUser",
    "stepFreeRequired",
    "accessibleToiletRequired",
    "lowSensoryNeeded",
    "hearingLoopNeeded",
    "AuslanNeeded",
    "AACFriendlyNeeded",
    "assistanceAnimal",
    "accessibleParkingNeeded",
    "dropOffNeeded",
    "transportSupportNeeded",
    "fatigueBufferNeeded",
  ];
  let count = boolKeys.filter((k) => profile[k]).length;
  if (profile.liftRequired) count += 1;
  if (profile.kerbRampRequired) count += 1;
  if (profile.changingPlacesPreferred) count += 1;
  if (profile.captioningPreferred) count += 1;
  if (profile.highContrastSignagePreferred) count += 1;
  if (profile.tactileCuesPreferred) count += 1;
  if (profile.quietAreaPreferred) count += 1;
  if (profile.lowStimulusPreferred) count += 1;
  if (profile.textCommunicationPreferred) count += 1;
  if (profile.minimumDoorWidthMm != null) count += 1;
  if (profile.minimumPathWidthMm != null) count += 1;
  if (profile.maximumPreferredGradientPercent != null) count += 1;
  if (profile.surfaceTolerance != null) count += 1;
  return count;
}

export function requirementsSummaryLabels(
  profile: AccessRequirementProfile,
): string[] {
  const labels: string[] = [];
  if (profile.stepFreeRequired) labels.push("Step-free");
  if (profile.wheelchairUser || profile.powerchairUser) {
    labels.push(profile.powerchairUser ? "Power mobility" : "Wheelchair");
  }
  if (profile.accessibleToiletRequired) labels.push("Accessible toilet");
  if (profile.hearingLoopNeeded) labels.push("Hearing loop");
  if (profile.lowSensoryNeeded) labels.push("Low sensory");
  if (profile.assistanceAnimal) labels.push("Assistance animal");
  if (profile.liftRequired) labels.push("Lift");
  if (profile.kerbRampRequired) labels.push("Kerb ramp");
  if (profile.changingPlacesPreferred) labels.push("Changing Places");
  if (profile.minimumPathWidthMm != null) {
    labels.push(`Path ≥ ${profile.minimumPathWidthMm} mm`);
  }
  if (profile.surfaceTolerance === "smooth_only") labels.push("Smooth surface");
  return labels.slice(0, 5);
}
