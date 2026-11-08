/**
 * MapAble Tourism domain types. Venue evidence is attributed, not independently
 * verified, unless status is independently_verified — which this Sydney demo
 * never claims.
 */

export type AccessEvidenceStatus =
  | "documented"
  | "independently_verified"
  | "requires_confirmation"
  | "unknown"
  | "conflicting";

/** Legacy hyphenated statuses used by OpenTripMap snapshots and older storage. */
export type LegacyEvidenceStatus =
  | "documented"
  | "requires-confirmation"
  | "unknown";

export type AccessFeature = {
  status: LegacyEvidenceStatus;
  detail: string;
};

export type AccessEvidence = {
  status: AccessEvidenceStatus;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  checkedOn: string;
  limitations: string[];
};

export type TourismPhoto = {
  src: string;
  alt: string;
  licence: string;
  credit: string;
};

export type TourismPlaceFeatures = {
  stepFree: AccessEvidence;
  toilets: AccessEvidence;
  extras: AccessEvidence[];
};

export type TourismPlaceCategory =
  | "Arts"
  | "Landmarks"
  | "Museums"
  | "Wildlife"
  | "Other";

export type TourismPlace = {
  id: string;
  name: string;
  category: TourismPlaceCategory;
  neighbourhood: string;
  address: string;
  description: string;
  coords: { latitude: number; longitude: number };
  /** Compatibility aliases for map markers and OpenTripMap snapshots. */
  latitude: number;
  longitude: number;
  photos: TourismPhoto[];
  features: TourismPlaceFeatures;
  caveats: string[];
  experienceMinutes: number;
  recommendedDay: number;
  sourceType?: "opentripmap";
  sourceId?: string;
  /** Mirrored from features for OpenTripMap tests and existing UI. */
  stepFree: AccessFeature;
  accessibleToilet: AccessFeature;
  caution: string;
  sourceName: string;
  sourceUrl: string;
  checkedOn: string;
};

export type AttractionStop = {
  kind: "attraction";
  id: string;
  placeId: string;
};

export type RestStop = {
  kind: "rest";
  id: string;
  title: string;
  note: string;
};

export type TransportLeg = {
  kind: "transport";
  id: string;
  mode: string;
  note: string;
  evidenceStatus: AccessEvidenceStatus;
};

export type TripStop = AttractionStop | RestStop | TransportLeg;

export type TripDay = {
  day: number;
  title: string;
  stops: TripStop[];
  /** Attraction place ids only — kept for OpenTripMap tests and older storage. */
  stopIds: string[];
};

export type TourismNeed =
  | "step-free"
  | "accessible-toilet"
  | "wheelchair-transport"
  | "accessible-accommodation"
  | "sensory"
  | "communication-access";

export type TourismBudget = "low" | "medium" | "high" | "unspecified";

export type RestBreakPreference = "frequent" | "standard" | "minimal";

export type TourismPlannerInput = {
  destination: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  travellers: number;
  accessPrefs: {
    stepFree: boolean;
    accessibleToilets: boolean;
    wheelchairTransport: boolean;
    accessibleAccommodation: boolean;
    sensory: boolean;
    communicationAccess: boolean;
  };
  modes: string[];
  budget: TourismBudget;
  interests: string[];
  restBreakPreference: RestBreakPreference;
};

export type TourismTrip = {
  id: "sydney-demo";
  destination: "Sydney";
  days: TripDay[];
  createdFrom: "local-demo" | "planner";
  plannerPrefs?: TourismPlannerInput;
  /** OpenTripMap snapshots are never treated as verified access evidence. */
  externalPlaces?: TourismPlace[];
};

export const TOURISM_TRIP_STORAGE_KEY = "mapable-tourism-sydney-demo-v1";
export const TOURISM_PREFS_STORAGE_KEY = "mapable-tourism-sydney-demo-prefs-v1";

export const TOURISM_NEEDS: { id: TourismNeed; label: string; hint: string }[] = [
  {
    id: "step-free",
    label: "Step-free access",
    hint: "Entries and internal paths; approach routes must be checked separately.",
  },
  {
    id: "accessible-toilet",
    label: "Accessible toilets",
    hint: "Published availability; measurements and operational status may differ.",
  },
  {
    id: "wheelchair-transport",
    label: "Wheelchair-accessible transport",
    hint: "Stored locally only. This prototype does not verify a complete accessible journey.",
  },
  {
    id: "accessible-accommodation",
    label: "Accessible accommodation",
    hint: "Preference only. No accommodation inventory or bookings in this prototype.",
  },
  {
    id: "sensory",
    label: "Sensory considerations",
    hint: "Quieter pacing and lower-stimulation rest stops. Not inferred from a disability label.",
  },
  {
    id: "communication-access",
    label: "Communication access",
    hint: "Reminder to check captions, Auslan, Easy Read or AAC. Not sent to third parties.",
  },
];

export function defaultPlannerInput(): TourismPlannerInput {
  return {
    destination: "Sydney",
    startDate: "",
    endDate: "",
    durationDays: 3,
    travellers: 1,
    accessPrefs: {
      stepFree: true,
      accessibleToilets: true,
      wheelchairTransport: false,
      accessibleAccommodation: false,
      sensory: false,
      communicationAccess: false,
    },
    modes: ["walk", "public-transport"],
    budget: "unspecified",
    interests: ["harbour", "culture"],
    restBreakPreference: "standard",
  };
}

export function evidenceToLegacy(status: AccessEvidenceStatus): LegacyEvidenceStatus {
  switch (status) {
    case "documented":
      return "documented";
    case "independently_verified":
      return "documented";
    case "requires_confirmation":
      return "requires-confirmation";
    case "unknown":
      return "unknown";
    case "conflicting":
      return "requires-confirmation";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function legacyToEvidence(status: LegacyEvidenceStatus): AccessEvidenceStatus {
  switch (status) {
    case "documented":
      return "documented";
    case "requires-confirmation":
      return "requires_confirmation";
    case "unknown":
      return "unknown";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function attractionIdsOnDay(day: TripDay): string[] {
  return day.stops
    .filter((stop): stop is AttractionStop => stop.kind === "attraction")
    .map((stop) => stop.placeId);
}

export function tripStopId(stop: TripStop): string {
  switch (stop.kind) {
    case "attraction":
    case "rest":
    case "transport":
      return stop.id;
    default: {
      const _exhaustive: never = stop;
      return _exhaustive;
    }
  }
}
