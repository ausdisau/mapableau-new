import type { RightsDecisionReason } from "@/lib/rights-os/types";

export const REASON_CODES = {
  PURPOSE_MISSING: "PURPOSE_MISSING",
  PURPOSE_VAGUE: "PURPOSE_VAGUE",
  PURPOSE_UNREGISTERED: "PURPOSE_UNREGISTERED",
  PURPOSE_MISMATCH: "PURPOSE_MISMATCH",
  FIELD_REQUIRED: "FIELD_REQUIRED",
  FIELD_OPTIONAL: "FIELD_OPTIONAL",
  FIELD_PROHIBITED: "FIELD_PROHIBITED",
  FIELD_NOT_IN_PURPOSE: "FIELD_NOT_IN_PURPOSE",
  OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED",
  PARTICIPANT_REVIEW_REQUIRED: "PARTICIPANT_REVIEW_REQUIRED",
  HUMAN_REVIEW_REQUIRED: "HUMAN_REVIEW_REQUIRED",
  SECONDARY_USE_DENIED: "SECONDARY_USE_DENIED",
  ONWARD_SHARING_PROHIBITED: "ONWARD_SHARING_PROHIBITED",
  CONFLICT_DETECTED: "CONFLICT_DETECTED",
  LOWER_DISCLOSURE_AVAILABLE: "LOWER_DISCLOSURE_AVAILABLE",
} as const;

export type ReasonCode = (typeof REASON_CODES)[keyof typeof REASON_CODES];

export function reason(
  code: ReasonCode,
  message: string,
  field?: string
): RightsDecisionReason {
  return { code, message, field };
}

export const REASON_TEMPLATES: Record<ReasonCode, string> = {
  PURPOSE_MISSING: "No purpose was provided. Access cannot proceed without a registered purpose.",
  PURPOSE_VAGUE: "The purpose is too vague. MapAble requires a specific registered purpose.",
  PURPOSE_UNREGISTERED: "This purpose is not registered in the RightsOS purpose registry.",
  PURPOSE_MISMATCH: "The requested fields do not match the stated purpose.",
  FIELD_REQUIRED: "This field is required for the stated purpose.",
  FIELD_OPTIONAL: "This field is optional for the stated purpose.",
  FIELD_PROHIBITED: "This field is prohibited for the stated purpose.",
  FIELD_NOT_IN_PURPOSE: "This field is not included in the registered purpose definition.",
  OPERATION_NOT_ALLOWED: "This operation is not allowed for the stated purpose.",
  PARTICIPANT_REVIEW_REQUIRED: "The participant must review and approve before this information can be shared.",
  HUMAN_REVIEW_REQUIRED: "A human rights officer must review this request before proceeding.",
  SECONDARY_USE_DENIED: "Secondary use requires a new policy decision with a separate purpose.",
  ONWARD_SHARING_PROHIBITED: "Onward sharing is not permitted for this purpose.",
  CONFLICT_DETECTED: "A policy conflict was detected. The safe default is to require review.",
  LOWER_DISCLOSURE_AVAILABLE: "A lower-disclosure alternative is available.",
};
