import { getField } from "@/lib/rights-os/field-registry";
import { getPurpose } from "@/lib/rights-os/purpose-registry";
import { REASON_CODES, reason } from "@/lib/rights-os/reason-codes";
import type {
  FieldCompileResult,
  RightsDataOperation,
  RightsDecisionReason,
} from "@/lib/rights-os/types";

export function compileFields(params: {
  purposeCode: string;
  requestedFields: string[];
  recipientRole?: string;
  requestedOperations: RightsDataOperation[];
}): FieldCompileResult {
  const purpose = getPurpose(params.purposeCode);
  const reasons: RightsDecisionReason[] = [];
  const required: string[] = [];
  const optional: string[] = [];
  const prohibited: string[] = [];

  if (!purpose) {
    return {
      required: [],
      optional: [],
      prohibited: params.requestedFields,
      reasons: [
        reason(REASON_CODES.PURPOSE_UNREGISTERED, "Purpose not found for field compilation"),
      ],
      humanReviewRequired: true,
    };
  }

  const allowedSet = new Set(purpose.allowedFields);
  const prohibitedSet = new Set(purpose.prohibitedFields);

  for (const field of params.requestedFields) {
    if (prohibitedSet.has(field)) {
      prohibited.push(field);
      const def = getField(field);
      reasons.push(
        reason(
          REASON_CODES.FIELD_PROHIBITED,
          `${def?.displayName ?? field} is prohibited for ${purpose.description}.`,
          field
        )
      );
      continue;
    }

    if (allowedSet.has(field)) {
      required.push(field);
      reasons.push(
        reason(
          REASON_CODES.FIELD_REQUIRED,
          `${getField(field)?.displayName ?? field} is permitted for this purpose.`,
          field
        )
      );
      continue;
    }

    prohibited.push(field);
    reasons.push(
      reason(
        REASON_CODES.FIELD_NOT_IN_PURPOSE,
        `${field} is not part of the registered purpose field set.`,
        field
      )
    );
  }

  const lowerDisclosureAlternative = purpose.allowedFields.filter(
    (f) => !params.requestedFields.includes(f) && !prohibitedSet.has(f)
  );

  if (lowerDisclosureAlternative.length > 0 && prohibited.length > 0) {
    reasons.push(
      reason(
        REASON_CODES.LOWER_DISCLOSURE_AVAILABLE,
        `Consider sharing only: ${lowerDisclosureAlternative.join(", ")}.`
      )
    );
  }

  for (const op of params.requestedOperations) {
    if (!purpose.allowedOperations.includes(op)) {
      reasons.push(
        reason(
          REASON_CODES.OPERATION_NOT_ALLOWED,
          `Operation "${op}" is not allowed for this purpose.`
        )
      );
    }
  }

  return {
    required,
    optional,
    prohibited,
    reasons,
    lowerDisclosureAlternative:
      lowerDisclosureAlternative.length > 0 ? lowerDisclosureAlternative : undefined,
    humanReviewRequired: purpose.humanReviewRequired ?? false,
  };
}
