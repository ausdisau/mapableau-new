import type { AccessPassport, AccessRequirement } from "../schemas";

import type { JourneyContext, PersonalAccessTwin } from "./schemas";

export const TAYLOR_INTERVIEW_REQUIREMENTS: AccessRequirement[] = [
  {
    id: "taylor-step-free",
    featureType: "step_free",
    importance: "required",
    operator: "available",
    value: true,
    shareWithVenue: true,
  },
  {
    id: "taylor-door-ent",
    featureType: "clear_door_width_mm",
    importance: "required",
    operator: "minimum",
    value: 850,
    unit: "mm",
    shareWithVenue: true,
  },
  {
    id: "taylor-lift",
    featureType: "lift",
    importance: "required",
    operator: "available",
    value: true,
    shareWithVenue: true,
  },
  {
    id: "taylor-toilet",
    featureType: "accessible_toilet",
    importance: "required",
    operator: "available",
    value: true,
    shareWithVenue: false,
  },
  {
    id: "taylor-quiet",
    featureType: "quiet_waiting_area",
    importance: "preferred",
    operator: "available",
    value: true,
    shareWithVenue: false,
  },
  {
    id: "taylor-staff",
    featureType: "staff_assistance",
    importance: "preferred",
    operator: "available",
    value: true,
    shareWithVenue: false,
  },
];

export function buildTaylorInterviewPassport(userId: string): AccessPassport {
  const now = new Date().toISOString();
  return {
    id: "passport-taylor-interview",
    userId,
    name: "Taylor interview — power-chair access (demo)",
    requirements: TAYLOR_INTERVIEW_REQUIREMENTS,
    communicationPreferences: ["plain_language", "written"],
    mobilityAids: ["power_chair"],
    sharingDefaults: {
      shareRequiredWithVenue: false,
      sharePreferredWithVenue: false,
      shareHelpfulWithVenue: false,
      purpose: "Interview access planning only",
      durationHours: 24,
    },
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildPersonalAccessTwin(input: {
  passport: AccessPassport;
  journeyContext: Partial<JourneyContext> &
    Pick<JourneyContext, "purpose" | "destination">;
}): PersonalAccessTwin {
  return {
    passport: input.passport,
    journeyContext: {
      purpose: input.journeyContext.purpose,
      destination: input.journeyContext.destination,
      visitAt: input.journeyContext.visitAt,
      arrivalWindowMinutes: input.journeyContext.arrivalWindowMinutes ?? 30,
      currentMobilityAid: input.journeyContext.currentMobilityAid,
      companionCount: input.journeyContext.companionCount ?? 0,
      supportWorkerPresent: input.journeyContext.supportWorkerPresent ?? false,
      assistanceAnimalPresent: input.journeyContext.assistanceAnimalPresent ?? false,
      optimisationGoal: input.journeyContext.optimisationGoal ?? "highest_confidence",
      uncertaintyTolerance: input.journeyContext.uncertaintyTolerance ?? "moderate",
      temporaryRequirements: input.journeyContext.temporaryRequirements ?? [],
    },
  };
}

export function defaultInterviewTwin(userId: string): PersonalAccessTwin {
  return buildPersonalAccessTwin({
    passport: buildTaylorInterviewPassport(userId),
    journeyContext: {
      purpose: "Job interview",
      destination: "Interview Room 3.12",
      visitAt: "2026-07-16T00:00:00.000Z", // ~10:00 Sydney
      currentMobilityAid: "power_chair",
      optimisationGoal: "highest_confidence",
      uncertaintyTolerance: "low",
    },
  });
}
