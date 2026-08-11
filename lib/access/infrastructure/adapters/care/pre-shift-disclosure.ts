import type { AccessDisclosureRecipientRole } from "@prisma/client";

import { isCareAccessMatchingEnabled } from "@/lib/access/infrastructure/adapters/care";
import {
  confirmDisclosure,
  previewDisclosure,
  upsertDisclosurePolicy,
} from "@/lib/access/infrastructure/disclosure-service";
import { getPassportForUser } from "@/lib/access/infrastructure/passport-service";

export const CARE_PRE_SHIFT_PURPOSE = "pre_shift_brief";

/**
 * Attributes a care_worker may receive for a pre-shift brief.
 * Never includes diagnosis or employment-only fields.
 */
export const CARE_WORKER_DISCLOSURE_ATTRIBUTE_ALLOWLIST = [
  "communication_supports",
  "auslan_supports",
  "sensory_supports",
  "personal_care_supports",
  "equipment_supports",
  "assistance_animal_supports",
  "service_staff.adjustment_procedure",
  "speech_communication.text_fallback",
  "auslan_language.auslan_available",
  "sensory_regulation.quiet_space",
  "self_care_continence.accessible_toilet",
  "equipment_at.wheelchair_charging",
  "service_staff.high_intensity_competency",
] as const;

const CARE_WORKER_DISCLOSURE_DENYLIST = [
  "diagnosis",
  "medical_diagnosis",
  "employment_status",
  "employer_name",
  "ndis_budget",
  "medication",
] as const;

function isPermittedCareWorkerAttribute(key: string): boolean {
  const lower = key.toLowerCase();
  if (CARE_WORKER_DISCLOSURE_DENYLIST.some((d) => lower.includes(d))) {
    return false;
  }
  if (
    (CARE_WORKER_DISCLOSURE_ATTRIBUTE_ALLOWLIST as readonly string[]).includes(key)
  ) {
    return true;
  }
  // Allow functional ontology concepts from Care-relevant domains only.
  return (
    key.startsWith("speech_communication.") ||
    key.startsWith("auslan_language.") ||
    key.startsWith("sensory_regulation.") ||
    key.startsWith("self_care_continence.") ||
    key.startsWith("equipment_at.") ||
    key.startsWith("assistance_animals.") ||
    key.startsWith("service_staff.")
  );
}

/**
 * Ensure a care_worker disclosure policy exists and confirm a pre-shift receipt
 * for permitted passport attributes. Returns null when flags/passport off.
 */
export async function confirmCarePreShiftDisclosure(params: {
  participantUserId: string;
  workerProfileId: string;
  attributeKeys?: string[];
}): Promise<{
  receiptId: string;
  attributeKeys: string[];
  permittedAttributes: string[];
  permittedSummaryLines: string[];
} | null> {
  if (!isCareAccessMatchingEnabled()) return null;

  const passport = await getPassportForUser(params.participantUserId);
  if (!passport) return null;

  const requested = (
    params.attributeKeys ??
    passport.requirements
      .filter((r) =>
        r.disclosureScopes.some((s) =>
          ["worker", "service_provider", "care_worker"].includes(s),
        ),
      )
      .map((r) => r.ontologyConceptId)
  ).filter(isPermittedCareWorkerAttribute);

  if (requested.length === 0) {
    requested.push(
      ...passport.requirements
        .filter((r) =>
          [
            "speech_communication",
            "auslan_language",
            "service_staff",
            "sensory_regulation",
            "self_care_continence",
            "equipment_at",
          ].includes(r.domain),
        )
        .map((r) => r.ontologyConceptId)
        .filter(isPermittedCareWorkerAttribute),
    );
  }

  const allowedAttributes = [...new Set(requested)];

  await upsertDisclosurePolicy({
    userId: params.participantUserId,
    recipientRole: "care_worker" as AccessDisclosureRecipientRole,
    purpose: CARE_PRE_SHIFT_PURPOSE,
    allowedAttributes,
  });

  const preview = await previewDisclosure({
    userId: params.participantUserId,
    recipientRole: "care_worker",
    purpose: CARE_PRE_SHIFT_PURPOSE,
    requestedAttributes: allowedAttributes,
  });
  if (!preview) return null;

  const receipt = await confirmDisclosure({
    userId: params.participantUserId,
    recipientRole: "care_worker",
    recipientRef: params.workerProfileId,
    purpose: CARE_PRE_SHIFT_PURPOSE,
    attributeKeys: preview.permittedAttributes,
    policyId: preview.policyId,
  });
  if (!receipt) return null;

  const permittedSummaryLines = passport.requirements
    .filter((r) => receipt.attributeKeys.includes(r.ontologyConceptId))
    .map((r) => `${r.attribute}: ${String(r.value ?? "required")}`);

  return {
    receiptId: receipt.receiptId,
    attributeKeys: receipt.attributeKeys,
    permittedAttributes: receipt.attributeKeys,
    permittedSummaryLines,
  };
}
