export type AccessNeed = {
  wheelchairUser: boolean;
  powerchairUser: boolean;
  stepFreeRequired: boolean;
  accessibleToiletRequired: boolean;
  lowSensoryNeeded: boolean;
  hearingLoopNeeded: boolean;
  AuslanNeeded: boolean;
  AACFriendlyNeeded: boolean;
  assistanceAnimal: boolean;
  accessibleParkingNeeded: boolean;
  dropOffNeeded: boolean;
  transportSupportNeeded: boolean;
  fatigueBufferNeeded: boolean;
};

export type PlaceAccessProfile = {
  stepFreeEntry: boolean | null;
  doorWidthMm: number | null;
  internalStepFree: boolean | null;
  accessibleToilet: boolean | null;
  accessibleParking: boolean | null;
  dropOffPoint: boolean | null;
  lowSensoryOption: boolean | null;
  hearingLoop: boolean | null;
  staffTraining: boolean | null;
  assistanceAnimalWelcome: boolean | null;
  publicTransportNearby: boolean | null;
  transportBookable: boolean | null;
  lastVerified: string | null;
  confidence: "high" | "medium" | "low" | "unknown";
  /** Extended capability facts — null means UNKNOWN (never fabricate). */
  pathWidthMm?: number | null;
  maxGradientPercent?: number | null;
  kerbRampPresent?: boolean | null;
  liftPresent?: boolean | null;
  changingPlacesPresent?: boolean | null;
  captioningAvailable?: boolean | null;
  highContrastSignage?: boolean | null;
  tactileCues?: boolean | null;
  quietArea?: boolean | null;
  lowStimulusEnvironment?: boolean | null;
  textAacCommunication?: boolean | null;
  surfaceFirmness?: "smooth" | "firm" | "uneven" | "unknown" | null;
};

export type AccessFitLabel =
  | "strong fit"
  | "possible fit"
  | "needs confirmation"
  | "likely barrier"
  | "unknown";

export type AccessFitResult = {
  score: number;
  label: AccessFitLabel;
  matches: string[];
  barriers: string[];
  unknowns: string[];
  recommendedQuestions: string[];
};

export const EMPTY_ACCESS_NEEDS: AccessNeed = {
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
};

export const DEMO_ACCESS_NEEDS: AccessNeed = {
  wheelchairUser: true,
  powerchairUser: false,
  stepFreeRequired: true,
  accessibleToiletRequired: true,
  lowSensoryNeeded: false,
  hearingLoopNeeded: false,
  AuslanNeeded: false,
  AACFriendlyNeeded: false,
  assistanceAnimal: false,
  accessibleParkingNeeded: true,
  dropOffNeeded: true,
  transportSupportNeeded: false,
  fatigueBufferNeeded: true,
};
