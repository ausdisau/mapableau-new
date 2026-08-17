/**
 * Capture purpose registry — purpose gates models, retention, location, upload, moderation.
 * Camera permission does not create consent to upload.
 */

export const VISION_CAPTURE_PURPOSES = [
  "vision.personal_journey_check",
  "vision.capture_entrance",
  "vision.capture_pathway",
  "vision.capture_toilet",
  "vision.capture_parking",
  "vision.provisional_measurement",
  "vision.mapper_survey",
  "vision.submit_barrier",
  "vision.remote_assistance",
  "vision.model_improvement_contribution",
  "vision.synthetic_demo",
] as const;

export type VisionCapturePurpose = (typeof VISION_CAPTURE_PURPOSES)[number];

export type VisionCapturePurposeDefinition = {
  purpose: VisionCapturePurpose;
  label: string;
  description: string;
  productMode:
    | "stop_and_scan"
    | "guided_measurement"
    | "mapper_survey"
    | "personal_journey_check"
    | "live_advisory"
    | "remote_assistance"
    | "synthetic_demo";
  requestsLocation: boolean;
  mayStoreMedia: boolean;
  offersUpload: boolean;
  defaultRetention: "ephemeral" | "session" | "participant_selected" | "none";
  moderationRoute: "none" | "optional" | "required_if_submitted";
  modelImprovementEligible: boolean;
  /** Wave 1: only synthetic_demo is active without further flags. */
  wave1Available: boolean;
};

export const VISION_CAPTURE_PURPOSE_REGISTRY: Record<
  VisionCapturePurpose,
  VisionCapturePurposeDefinition
> = {
  "vision.personal_journey_check": {
    purpose: "vision.personal_journey_check",
    label: "Personal journey check",
    description:
      "Compare a scene with your selected Access Passport requirements. Private by default.",
    productMode: "personal_journey_check",
    requestsLocation: false,
    mayStoreMedia: false,
    offersUpload: false,
    defaultRetention: "ephemeral",
    moderationRoute: "none",
    modelImprovementEligible: false,
    wave1Available: false,
  },
  "vision.capture_entrance": {
    purpose: "vision.capture_entrance",
    label: "Entrance observation",
    description: "Scan an entrance for doorway, step, ramp or obstruction candidates.",
    productMode: "stop_and_scan",
    requestsLocation: true,
    mayStoreMedia: true,
    offersUpload: true,
    defaultRetention: "participant_selected",
    moderationRoute: "required_if_submitted",
    modelImprovementEligible: false,
    wave1Available: false,
  },
  "vision.capture_pathway": {
    purpose: "vision.capture_pathway",
    label: "Pathway observation",
    description: "Scan a pathway for blockage, surface or level-change candidates.",
    productMode: "stop_and_scan",
    requestsLocation: true,
    mayStoreMedia: true,
    offersUpload: true,
    defaultRetention: "participant_selected",
    moderationRoute: "required_if_submitted",
    modelImprovementEligible: false,
    wave1Available: false,
  },
  "vision.capture_toilet": {
    purpose: "vision.capture_toilet",
    label: "Toilet feature survey",
    description: "Capture accessible toilet feature candidates for private or moderated use.",
    productMode: "mapper_survey",
    requestsLocation: false,
    mayStoreMedia: true,
    offersUpload: true,
    defaultRetention: "participant_selected",
    moderationRoute: "required_if_submitted",
    modelImprovementEligible: false,
    wave1Available: false,
  },
  "vision.capture_parking": {
    purpose: "vision.capture_parking",
    label: "Parking observation",
    description:
      "Observe accessible parking bay or aisle obstruction candidates. Plates must be redacted.",
    productMode: "stop_and_scan",
    requestsLocation: true,
    mayStoreMedia: true,
    offersUpload: true,
    defaultRetention: "participant_selected",
    moderationRoute: "required_if_submitted",
    modelImprovementEligible: false,
    wave1Available: false,
  },
  "vision.provisional_measurement": {
    purpose: "vision.provisional_measurement",
    label: "Provisional measurement",
    description:
      "Guided capture for provisional width, threshold or slope estimates. Not a certified measurement.",
    productMode: "guided_measurement",
    requestsLocation: false,
    mayStoreMedia: true,
    offersUpload: false,
    defaultRetention: "session",
    moderationRoute: "none",
    modelImprovementEligible: false,
    wave1Available: false,
  },
  "vision.mapper_survey": {
    purpose: "vision.mapper_survey",
    label: "Mapper survey",
    description: "Structured survey producing a draft evidence bundle for moderation.",
    productMode: "mapper_survey",
    requestsLocation: true,
    mayStoreMedia: true,
    offersUpload: true,
    defaultRetention: "participant_selected",
    moderationRoute: "required_if_submitted",
    modelImprovementEligible: false,
    wave1Available: false,
  },
  "vision.submit_barrier": {
    purpose: "vision.submit_barrier",
    label: "Barrier report",
    description: "Prepare a participant-controlled barrier report for review.",
    productMode: "stop_and_scan",
    requestsLocation: true,
    mayStoreMedia: true,
    offersUpload: true,
    defaultRetention: "participant_selected",
    moderationRoute: "required_if_submitted",
    modelImprovementEligible: false,
    wave1Available: false,
  },
  "vision.remote_assistance": {
    purpose: "vision.remote_assistance",
    label: "Remote human assistance",
    description:
      "Explicitly share selected imagery with a trusted helper. RightsOS controls disclosure.",
    productMode: "remote_assistance",
    requestsLocation: true,
    mayStoreMedia: true,
    offersUpload: true,
    defaultRetention: "session",
    moderationRoute: "none",
    modelImprovementEligible: false,
    wave1Available: false,
  },
  "vision.model_improvement_contribution": {
    purpose: "vision.model_improvement_contribution",
    label: "Model improvement contribution",
    description:
      "Optional separate consent to contribute redacted captures for evaluation. Never default on.",
    productMode: "mapper_survey",
    requestsLocation: false,
    mayStoreMedia: true,
    offersUpload: true,
    defaultRetention: "participant_selected",
    moderationRoute: "optional",
    modelImprovementEligible: true,
    wave1Available: false,
  },
  "vision.synthetic_demo": {
    purpose: "vision.synthetic_demo",
    label: "Synthetic demo",
    description:
      "Fixture scenes only. No camera, no upload, no canonical writes, no live alerts.",
    productMode: "synthetic_demo",
    requestsLocation: false,
    mayStoreMedia: false,
    offersUpload: false,
    defaultRetention: "none",
    moderationRoute: "none",
    modelImprovementEligible: false,
    wave1Available: true,
  },
};

export function getCapturePurpose(
  purpose: VisionCapturePurpose,
): VisionCapturePurposeDefinition {
  return VISION_CAPTURE_PURPOSE_REGISTRY[purpose];
}

export function listWave1CapturePurposes(): VisionCapturePurposeDefinition[] {
  return Object.values(VISION_CAPTURE_PURPOSE_REGISTRY).filter((p) => p.wave1Available);
}
