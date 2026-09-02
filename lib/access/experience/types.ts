import type { AccessNeed } from "@/lib/access/fit/types";
import type { GaisEvidenceState } from "@/lib/gais/contracts/evidence";


/** Functional participant-selected requirements — not diagnosis-based. */
export type AccessRequirementProfile = AccessNeed & {
  minimumPathWidthMm?: number | null;
  minimumDoorWidthMm?: number | null;
  maximumPreferredGradientPercent?: number | null;
  kerbRampRequired?: boolean;
  liftRequired?: boolean;
  changingPlacesPreferred?: boolean;
  captioningPreferred?: boolean;
  highContrastSignagePreferred?: boolean;
  tactileCuesPreferred?: boolean;
  quietAreaPreferred?: boolean;
  lowStimulusPreferred?: boolean;
  textCommunicationPreferred?: boolean;
  surfaceTolerance?: "smooth_only" | "firm_ok" | "any" | null;
};

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type ExplorationPresentationMode = "MAP" | "LIST" | "AROUND_ME" | "AUDIO";

export type EvidencePreference = "ALL" | "HIGH_CONFIDENCE" | "VERIFIED_ONLY";

export type UnknownHandling = "SHOW" | "WARN" | "AVOID_WHEN_POSSIBLE";

export type AccessExplorationState = {
  origin?: GeoPoint;
  destination?: GeoPoint;
  requirements: AccessRequirementProfile;
  /** Saved profile snapshot — journey override does not mutate this. */
  savedRequirements?: AccessRequirementProfile;
  /** When set, active requirements = journey override only for this session. */
  journeyOverride?: AccessRequirementProfile | null;
  selectedPlaceId?: string;
  selectedRouteId?: string;
  presentationMode: ExplorationPresentationMode;
  evidencePreference: EvidencePreference;
  unknownHandling: UnknownHandling;
  offlineMode: boolean;
};

/** Future Phase 2 — design contract only. */
export type AccessibilityCompassItem = {
  bearingClock: number;
  distanceMetres: number;
  feature: string;
  evidenceState: GaisEvidenceState;
  label: string;
};

/** Future Navigate boundary — design contract only; no fake router in Phase 1. */
export type AccessibleRouteOption = {
  id: string;
  distanceMetres: number;
  estimatedDurationSeconds?: number;
  unknownSegmentCount: number;
  dependencies?: { type: string; label: string }[];
};

export const LIVE_PRESENTATION_MODES: ExplorationPresentationMode[] = [
  "MAP",
  "LIST",
];

export const DEFAULT_ACCESS_REQUIREMENT_PROFILE: AccessRequirementProfile = {
  wheelchairUser: false,
  powerchairUser: false,
  stepFreeRequired: false,
  accessibleToiletRequired: false,
  lowSensoryNeeded: false,
  hearingLoopNeeded: false,
  AuslanNeeded: false,
  AACFriendlyNeeded: false,
  assistanceAnimal: false,
  accessibleParkingNeeded: false,
  dropOffNeeded: false,
  transportSupportNeeded: false,
  fatigueBufferNeeded: false,
  minimumPathWidthMm: null,
  minimumDoorWidthMm: null,
  maximumPreferredGradientPercent: null,
  kerbRampRequired: false,
  liftRequired: false,
  changingPlacesPreferred: false,
  captioningPreferred: false,
  highContrastSignagePreferred: false,
  tactileCuesPreferred: false,
  quietAreaPreferred: false,
  lowStimulusPreferred: false,
  textCommunicationPreferred: false,
  surfaceTolerance: null,
};
