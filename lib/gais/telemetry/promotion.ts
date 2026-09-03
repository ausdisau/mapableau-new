import type {
  AccessibilityObservation,
  GaisPromotionState,
} from "./contracts";

/**
 * Promotion workflow for sensor observations.
 * Sensor observation does NOT automatically become public evidence.
 *
 * received → validated → candidate_evidence → moderation → published | rejected
 */
export const GAIS_PROMOTION_TRANSITIONS: Record<
  GaisPromotionState,
  readonly GaisPromotionState[]
> = {
  received: ["validated", "rejected"],
  validated: ["candidate_evidence", "rejected"],
  candidate_evidence: ["moderation", "rejected"],
  moderation: ["published", "rejected"],
  published: [],
  rejected: [],
};

export function canTransitionPromotion(
  from: GaisPromotionState,
  to: GaisPromotionState,
): boolean {
  return GAIS_PROMOTION_TRANSITIONS[from].includes(to);
}

export function assertSensorNeverAutoVerified(
  observation: Pick<AccessibilityObservation, "verificationState" | "promotionState">,
): boolean {
  if (observation.verificationState === "SENSOR_OBSERVED" && observation.promotionState === "received") {
    return true;
  }
  // SENSOR_OBSERVED may remain even after publish as evidence class — never claim VERIFIED from sensor alone.
  return observation.verificationState === "SENSOR_OBSERVED";
}

export type PromotionDecision = {
  observationId: string;
  toState: GaisPromotionState;
  note?: string;
};
