/**
 * Communication Passport source-of-truth resolution (Phase 04).
 *
 * Canonical read/write for relational UX: `lib/support/communication-passport`.
 * Legacy mobile AAC path (`lib/communication/communication-passport-service`) remains
 * for Prisma-backed mobile surfaces; relational flows MUST use this adapter.
 */

export {
  type CommunicationMode,
  type CommunicationPassport,
  type CommunicationPassportInstruction,
  type WorkerPassportAcknowledgement,
} from "@/lib/support/communication-passport/types";

export const COMMUNICATION_PASSPORT_SOURCE_OF_TRUTH =
  "lib/support/communication-passport" as const;

/** Fields a participant may disclose for Navigator / relational matching. */
export const RELATIONAL_DISCLOSABLE_FIELD_KEYS = [
  "location",
  "serviceType",
  "accessibility",
  "communication",
] as const;

export type RelationalDisclosableFieldKey =
  (typeof RELATIONAL_DISCLOSABLE_FIELD_KEYS)[number];

export function isRelationalDisclosableField(
  key: string,
): key is RelationalDisclosableFieldKey {
  return (RELATIONAL_DISCLOSABLE_FIELD_KEYS as readonly string[]).includes(key);
}
