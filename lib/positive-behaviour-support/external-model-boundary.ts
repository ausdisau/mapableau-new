import { createHash } from "node:crypto";

import { pbsConfig } from "@/lib/config/positive-behaviour-support";

import {
  PBS_EXTERNAL_FIELD_ALLOWLIST,
  PBS_EXTERNAL_FORBIDDEN_FIELD_KEYS,
  type PbsDeidentifiedPayload,
} from "./types";

export interface ExternalModelBoundaryResult {
  allowed: boolean;
  reason: string;
  inputHash?: string;
  payloadForDisplay?: PbsDeidentifiedPayload;
}

const PLACEHOLDER_PARTICIPANT = "{{PARTICIPANT}}";

/**
 * External model use remains separately disabled by default.
 * Free text never transmits unless a practitioner approved the exact payload.
 */
export function evaluateExternalModelPayload(
  payload: PbsDeidentifiedPayload,
): ExternalModelBoundaryResult {
  if (!pbsConfig.enabled) {
    return { allowed: false, reason: "PBS module disabled" };
  }
  if (!pbsConfig.externalModelEnabled) {
    return {
      allowed: false,
      reason: "MAPABLE_PBS_EXTERNAL_MODEL_ENABLED is false",
    };
  }

  for (const field of payload.fields) {
    if (
      (PBS_EXTERNAL_FORBIDDEN_FIELD_KEYS as readonly string[]).includes(
        field.key,
      )
    ) {
      return {
        allowed: false,
        reason: `Forbidden field key: ${field.key}`,
      };
    }
    if (
      !(PBS_EXTERNAL_FIELD_ALLOWLIST as readonly string[]).includes(field.key) &&
      !field.allowlisted
    ) {
      return {
        allowed: false,
        reason: `Field not on allowlist: ${field.key}`,
      };
    }
  }

  if (payload.freeTextApprovedExact != null) {
    if (!payload.freeTextApprovalId) {
      return {
        allowed: false,
        reason: "Free text without de-identification approval is rejected",
      };
    }
    if (!payload.freeTextApprovedExact.includes(PLACEHOLDER_PARTICIPANT)) {
      // Free text may be empty of participant refs; require placeholders object for reinsertion
      if (!payload.placeholders[PLACEHOLDER_PARTICIPANT]) {
        return {
          allowed: false,
          reason:
            "De-identified free text must use stable placeholders such as {{PARTICIPANT}} when referring to the person",
        };
      }
    }
  }

  const inputHash = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");

  return {
    allowed: true,
    reason: "Allowlisted structured payload; display exact payload before approval",
    inputHash,
    payloadForDisplay: payload,
  };
}

export function validateExternalModelOutput(params: {
  outputText: string;
  requiredPlaceholders: string[];
  containsRestrictivePracticeInstruction: boolean;
  introducesUnsupportedFacts: boolean;
}): void {
  for (const ph of params.requiredPlaceholders) {
    if (!params.outputText.includes(ph)) {
      throw new Error(
        `External model output rejected: missing required placeholder ${ph}`,
      );
    }
  }
  if (params.containsRestrictivePracticeInstruction) {
    throw new Error(
      "External model output rejected: contains restrictive-practice instructions",
    );
  }
  if (params.introducesUnsupportedFacts) {
    throw new Error(
      "External model output rejected: introduces unsupported facts",
    );
  }
}

/** Models never write directly to a final plan — candidates only. */
export function assertModelCannotWriteCanonicalPlan(
  targetStatus: string,
): void {
  if (
    targetStatus === "finalised" ||
    targetStatus === "active" ||
    targetStatus === "review_due"
  ) {
    throw new Error(
      "Model output cannot directly change canonical final/active plan data",
    );
  }
}
