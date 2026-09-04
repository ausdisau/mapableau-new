import type { DataClass } from "@/lib/ai/platform/types/classification";

import type { ProcessingSensitivity } from "./contracts";
import {
  requiredConsentScopesForPurpose,
  type GuardianPurpose,
} from "./purpose-policy";
import type { GuardianReasonCode } from "./reason-codes";
import { maxSensitivity } from "./processing-sensitivity";

export type PrivacyGateInput = {
  purpose: GuardianPurpose;
  actorId: string;
  actorTenantId?: string;
  tenantId?: string;
  participantId?: string;
  dataClasses: DataClass[];
  consentScopesPresent?: string[];
  /** When false, authority check fails. */
  authorityGranted?: boolean;
  minimumNecessaryFields?: string[];
  /** Fields caller requested beyond minimumNecessaryFields. */
  requestedFields?: string[];
  authorityDecisionId?: string;
  consentReceiptIds?: string[];
};

export type AppStyleRoutingReceipt = {
  purpose: string;
  dataClasses: DataClass[];
  sensitivity: ProcessingSensitivity;
  authorityDecisionId?: string;
  consentReceiptIds?: string[];
  minimumNecessaryFields?: string[];
  collectedAt: string;
};

export type PrivacyGateResult =
  | {
      allowed: true;
      receipt: AppStyleRoutingReceipt;
      sensitivity: ProcessingSensitivity;
    }
  | {
      allowed: false;
      reasonCodes: GuardianReasonCode[];
      sensitivity: ProcessingSensitivity;
      receipt: AppStyleRoutingReceipt;
    };

export function evaluatePrivacyGate(input: PrivacyGateInput): PrivacyGateResult {
  const sensitivity = maxSensitivity(input.dataClasses);
  const receipt: AppStyleRoutingReceipt = {
    purpose: input.purpose,
    dataClasses: [...input.dataClasses],
    sensitivity,
    authorityDecisionId: input.authorityDecisionId,
    consentReceiptIds: input.consentReceiptIds,
    minimumNecessaryFields: input.minimumNecessaryFields,
    collectedAt: new Date().toISOString(),
  };

  const reasonCodes: GuardianReasonCode[] = [];

  if (
    input.tenantId &&
    input.actorTenantId &&
    input.tenantId !== input.actorTenantId
  ) {
    reasonCodes.push("CROSS_TENANT_DENIED");
  }

  if (input.authorityGranted === false) {
    reasonCodes.push("INSUFFICIENT_AUTHORITY");
  }

  const required = requiredConsentScopesForPurpose(input.purpose);
  const present = new Set(input.consentScopesPresent ?? []);
  if (required.length > 0) {
    const missing = required.filter((s) => !present.has(s));
    if (missing.length > 0) {
      reasonCodes.push("CONSENT_SCOPE_MISSING", "CONSENT_REVOKED_OR_ABSENT");
    }
  }

  if (
    input.minimumNecessaryFields &&
    input.requestedFields &&
    input.requestedFields.some(
      (f) => !input.minimumNecessaryFields!.includes(f)
    )
  ) {
    reasonCodes.push("MINIMUM_NECESSARY_VIOLATION", "PURPOSE_SCOPE_EXCEEDED");
  }

  // D4 credentials/secrets never for general disclosure purposes
  if (
    sensitivity === "D4_RESTRICTED" &&
    input.dataClasses.includes("credentials_secrets") &&
    input.purpose !== "audit_transparency"
  ) {
    reasonCodes.push("SENSITIVITY_NO_GENERAL_PURPOSE_MODEL");
  }

  if (reasonCodes.length > 0) {
    return { allowed: false, reasonCodes, sensitivity, receipt };
  }

  return { allowed: true, receipt, sensitivity };
}
