export type AccessLensMode = "user" | "business" | "transport" | "sensory";

export type AccessLensVerificationStatus =
  | "community_reported"
  | "business_supplied"
  | "partner_supplied"
  | "mapable_reviewed"
  | "mapable_verified"
  | "needs_update";

export type AccessLensObservationType =
  | "entrance"
  | "step"
  | "threshold"
  | "ramp"
  | "doorway"
  | "toilet"
  | "lift"
  | "path"
  | "kerb-ramp"
  | "parking"
  | "dropoff"
  | "quiet-space"
  | "sensory-warning"
  | "signage"
  | "hazard";

export type AccessLensObservation = {
  id: string;
  type: AccessLensObservationType;
  label: string;
  distanceLabel?: string;
  note?: string;
  verificationStatus: AccessLensVerificationStatus;
  mode?: AccessLensMode;
  listPriority?: number;
};

export const ACCESS_LENS_VERIFICATION_LABELS: Record<
  AccessLensVerificationStatus,
  string
> = {
  community_reported: "Community reported",
  business_supplied: "Business supplied",
  partner_supplied: "Partner supplied",
  mapable_reviewed: "MapAble reviewed",
  mapable_verified: "MapAble verified",
  needs_update: "Needs update",
};

export const ACCESS_LENS_OBSERVATION_TYPE_LABELS: Record<
  AccessLensObservationType,
  string
> = {
  entrance: "Entrance",
  step: "Step",
  threshold: "Threshold",
  ramp: "Ramp",
  doorway: "Doorway",
  toilet: "Toilet",
  lift: "Lift",
  path: "Path",
  "kerb-ramp": "Kerb ramp",
  parking: "Parking",
  dropoff: "Drop-off",
  "quiet-space": "Quiet space",
  "sensory-warning": "Sensory warning",
  signage: "Signage",
  hazard: "Hazard",
};

export const ACCESS_LENS_MODE_LABELS: Record<AccessLensMode, string> = {
  user: "User Lens",
  business: "Business Lens",
  transport: "Transport and pickup",
  sensory: "Sensory-friendly mode",
};

export const ACCESS_LENS_TRUST_NOTE =
  "Access Lens provides practical access information. It is not a guarantee of access or legal compliance.";

export const ACCESS_LENS_DISCLAIMER =
  "MapAble Access Lens provides practical access information to help people plan outings. It is not a guarantee of access and is not legal, building, transport, medical or NDIS advice. Conditions can change. Check opening hours, bookings, transport availability and venue accessibility before travelling.";
