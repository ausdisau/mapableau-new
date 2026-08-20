import {
  DEFAULT_MOBILITY_CONSTRAINTS,
  type MobilityRoutingConstraints,
} from "@/lib/access/navigate/types";
import type { MobilityRoutingProfile } from "@/lib/go/contracts/route-contracts";
import { prisma } from "@/lib/prisma";

export async function ensureAccessPassport(userId: string) {
  return prisma.accessPassport.upsert({
    where: { userId },
    create: { userId, containsDiagnosis: false },
    update: {},
  });
}

export async function getMobilityRoutingProfile(
  userId: string,
): Promise<MobilityRoutingProfile | null> {
  const passport = await prisma.accessPassport.findUnique({
    where: { userId },
    include: { mobilityRoutingPreference: true },
  });
  if (!passport?.mobilityRoutingPreference) return null;
  const p = passport.mobilityRoutingPreference;
  return {
    mobilityAidType: p.mobilityAidType as MobilityRoutingProfile["mobilityAidType"],
    chairWidthMm: p.chairWidthMm ?? undefined,
    chairLengthMm: p.chairLengthMm ?? undefined,
    minimumPreferredPathWidthMm: p.minimumPreferredPathWidthMm ?? undefined,
    preferredMaximumSlopePercent: p.preferredMaximumSlopePercent ?? undefined,
    absoluteMaximumSlopePercent: p.absoluteMaximumSlopePercent ?? undefined,
    preferredMaximumCrossSlopePercent:
      p.preferredMaximumCrossSlopePercent ?? undefined,
    curbRampRequired: p.curbRampRequired,
    stairsAllowed: p.stairsAllowed,
    preferredSurfaceTypes: p.preferredSurfaceTypes as MobilityRoutingProfile["preferredSurfaceTypes"],
    avoidedSurfaceTypes: p.avoidedSurfaceTypes as MobilityRoutingProfile["avoidedSurfaceTypes"],
    roughSurfaceTolerance: p.roughSurfaceTolerance as MobilityRoutingProfile["roughSurfaceTolerance"],
    unknownSegmentPolicy: p.unknownSegmentPolicy as MobilityRoutingProfile["unknownSegmentPolicy"],
    lowConfidencePolicy: p.lowConfidencePolicy as MobilityRoutingProfile["lowConfidencePolicy"],
    liftRequirement: p.liftRequirement,
    accessibleToiletPreference: p.accessibleToiletPreference,
    restStopPreference: p.restStopPreference,
  };
}

export async function upsertMobilityRoutingProfile(
  userId: string,
  profile: MobilityRoutingProfile,
) {
  const passport = await ensureAccessPassport(userId);
  return prisma.accessMobilityRoutingPreference.upsert({
    where: { passportId: passport.id },
    create: {
      passportId: passport.id,
      mobilityAidType: profile.mobilityAidType,
      chairWidthMm: profile.chairWidthMm,
      chairLengthMm: profile.chairLengthMm,
      minimumPreferredPathWidthMm: profile.minimumPreferredPathWidthMm,
      preferredMaximumSlopePercent: profile.preferredMaximumSlopePercent,
      absoluteMaximumSlopePercent: profile.absoluteMaximumSlopePercent,
      preferredMaximumCrossSlopePercent: profile.preferredMaximumCrossSlopePercent,
      curbRampRequired: profile.curbRampRequired ?? true,
      stairsAllowed: profile.stairsAllowed ?? false,
      preferredSurfaceTypes: profile.preferredSurfaceTypes ?? [],
      avoidedSurfaceTypes: profile.avoidedSurfaceTypes ?? [],
      roughSurfaceTolerance: profile.roughSurfaceTolerance,
      unknownSegmentPolicy: profile.unknownSegmentPolicy ?? "allow_with_warning",
      lowConfidencePolicy: profile.lowConfidencePolicy ?? "allow_with_warning",
      liftRequirement: profile.liftRequirement ?? false,
      accessibleToiletPreference: profile.accessibleToiletPreference ?? false,
      restStopPreference: profile.restStopPreference ?? false,
    },
    update: {
      mobilityAidType: profile.mobilityAidType,
      chairWidthMm: profile.chairWidthMm,
      chairLengthMm: profile.chairLengthMm,
      minimumPreferredPathWidthMm: profile.minimumPreferredPathWidthMm,
      preferredMaximumSlopePercent: profile.preferredMaximumSlopePercent,
      absoluteMaximumSlopePercent: profile.absoluteMaximumSlopePercent,
      preferredMaximumCrossSlopePercent: profile.preferredMaximumCrossSlopePercent,
      curbRampRequired: profile.curbRampRequired ?? true,
      stairsAllowed: profile.stairsAllowed ?? false,
      preferredSurfaceTypes: profile.preferredSurfaceTypes ?? [],
      avoidedSurfaceTypes: profile.avoidedSurfaceTypes ?? [],
      roughSurfaceTolerance: profile.roughSurfaceTolerance,
      unknownSegmentPolicy: profile.unknownSegmentPolicy ?? "allow_with_warning",
      lowConfidencePolicy: profile.lowConfidencePolicy ?? "allow_with_warning",
      liftRequirement: profile.liftRequirement ?? false,
      accessibleToiletPreference: profile.accessibleToiletPreference ?? false,
      restStopPreference: profile.restStopPreference ?? false,
    },
  });
}

export function profileToConstraints(
  profile?: MobilityRoutingProfile | null,
): MobilityRoutingConstraints {
  return {
    chairWidthMm: profile?.chairWidthMm ?? DEFAULT_MOBILITY_CONSTRAINTS.chairWidthMm,
    minimumPreferredPathWidthMm:
      profile?.minimumPreferredPathWidthMm ??
      DEFAULT_MOBILITY_CONSTRAINTS.minimumPreferredPathWidthMm,
    preferredMaximumSlopePercent:
      profile?.preferredMaximumSlopePercent ??
      DEFAULT_MOBILITY_CONSTRAINTS.preferredMaximumSlopePercent,
    absoluteMaximumSlopePercent:
      profile?.absoluteMaximumSlopePercent ??
      DEFAULT_MOBILITY_CONSTRAINTS.absoluteMaximumSlopePercent,
    preferredMaximumCrossSlopePercent:
      profile?.preferredMaximumCrossSlopePercent ??
      DEFAULT_MOBILITY_CONSTRAINTS.preferredMaximumCrossSlopePercent,
    curbRampRequired:
      profile?.curbRampRequired ?? DEFAULT_MOBILITY_CONSTRAINTS.curbRampRequired,
    stairsAllowed:
      profile?.stairsAllowed ?? DEFAULT_MOBILITY_CONSTRAINTS.stairsAllowed,
    avoidedSurfaceTypes:
      (profile?.avoidedSurfaceTypes as MobilityRoutingConstraints["avoidedSurfaceTypes"]) ??
      DEFAULT_MOBILITY_CONSTRAINTS.avoidedSurfaceTypes,
    unknownSegmentPolicy:
      profile?.unknownSegmentPolicy ??
      DEFAULT_MOBILITY_CONSTRAINTS.unknownSegmentPolicy,
    lowConfidencePolicy:
      profile?.lowConfidencePolicy ??
      DEFAULT_MOBILITY_CONSTRAINTS.lowConfidencePolicy,
  };
}

export function defaultPowerWheelchairProfile(): MobilityRoutingProfile {
  return {
    mobilityAidType: "power_wheelchair",
    chairWidthMm: 700,
    minimumPreferredPathWidthMm: 1200,
    preferredMaximumSlopePercent: 5,
    absoluteMaximumSlopePercent: 8,
    preferredMaximumCrossSlopePercent: 2,
    curbRampRequired: true,
    stairsAllowed: false,
    avoidedSurfaceTypes: ["GRAVEL", "GRASS"],
    unknownSegmentPolicy: "allow_with_warning",
    lowConfidencePolicy: "allow_with_warning",
  };
}
