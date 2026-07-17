import type { DelegateRelationshipKind } from "@prisma/client";

/**
 * A relationship-kind classifier that is deliberately separate from
 * authority. This exists to prevent code paths from treating an
 * `emergency_contact` or `family_member` relationship as evidence of
 * authority.
 *
 * Callers should combine this with `authority.ts::hasAuthorityCategory` to
 * decide whether a given delegate can take an action.
 */

export function isInformalRelationship(
  kind: DelegateRelationshipKind
): boolean {
  return (
    kind === "family_member" ||
    kind === "informal_supporter" ||
    kind === "emergency_contact"
  );
}

export function isLegallyBackedRelationship(
  kind: DelegateRelationshipKind
): boolean {
  return (
    kind === "legal_guardian" ||
    kind === "power_of_attorney_personal" ||
    kind === "power_of_attorney_financial" ||
    kind === "nominee_ndis"
  );
}

/** Human-readable summary for participant UI. */
export function summariseRelationship(
  kind: DelegateRelationshipKind
): string {
  const map: Record<DelegateRelationshipKind, string> = {
    family_member:
      "Family member — a relationship, not an authority. They cannot sign or act on your behalf without an explicit delegation.",
    informal_supporter:
      "Informal supporter — someone who helps you day to day. They have no authority unless you grant it explicitly.",
    emergency_contact:
      "Emergency contact — reached only when you are in urgent need. Contact status is not access to your data.",
    legal_guardian:
      "Legal guardian — verified against a legal instrument. Scope depends on the instrument.",
    power_of_attorney_personal:
      "Personal power of attorney — verified against the instrument.",
    power_of_attorney_financial:
      "Financial power of attorney — verified against the instrument.",
    nominee_ndis:
      "NDIS nominee — recognised in the participant's NDIS plan.",
    professional_advocate:
      "Professional advocate — represents you within a documented advocacy engagement.",
    paid_supporter:
      "Paid supporter — a professional in your team, no legal authority unless explicitly delegated.",
    none: "No formal relationship on record.",
  };
  return map[kind];
}
