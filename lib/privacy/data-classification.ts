import type { DataClassification } from "@prisma/client";

export const DATA_CLASSES: DataClassification[] = [
  "public",
  "internal",
  "participant_controlled",
  "sensitive_disability",
  "sensitive_health",
  "ndis_plan_data",
  "financial",
  "safeguarding",
  "clinical",
  "credential_document",
];

export const FIELD_CLASSIFICATION: Record<string, DataClassification> = {
  ndisNumber: "ndis_plan_data",
  ndisPlanDetails: "ndis_plan_data",
  disabilityNotes: "sensitive_disability",
  medicalNotes: "clinical",
  homeAddress: "participant_controlled",
  bankAccount: "financial",
  incidentDetails: "safeguarding",
  verificationDocument: "credential_document",
};

export function classifyField(fieldKey: string): DataClassification {
  return FIELD_CLASSIFICATION[fieldKey] ?? "internal";
}
