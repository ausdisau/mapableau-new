import type { CareRequestType } from "@prisma/client";

import type { WwcBookingContext } from "@/types/wwc-verification";

export type WwcRequirementInput = WwcBookingContext & {
  careRequestType?: CareRequestType | null;
};

export function requiresWwcForBooking(input: WwcRequirementInput): boolean {
  if (input.safeguardingRestrictionActive) return true;
  if (input.participantUnder18) return true;
  if (input.mapableKids) return true;
  if (input.schoolTransport) return true;
  if (input.paediatricTherapy) return true;
  if (input.youthEmploymentSupport) return true;

  if (input.careRequestType === "therapy_assistance" && input.participantUnder18) {
    return true;
  }
  if (
    input.careRequestType === "employment_support" &&
    input.participantUnder18
  ) {
    return true;
  }

  return false;
}

export function describeWwcRequirementReasons(
  input: WwcRequirementInput
): string[] {
  const reasons: string[] = [];
  if (input.safeguardingRestrictionActive) {
    reasons.push("Active safeguarding restriction on participant account");
  }
  if (input.participantUnder18) {
    reasons.push("Participant is under 18");
  }
  if (input.mapableKids) {
    reasons.push("MapAble Kids booking or program");
  }
  if (input.schoolTransport) {
    reasons.push("School transport booking");
  }
  if (input.paediatricTherapy) {
    reasons.push("Paediatric therapy support");
  }
  if (input.youthEmploymentSupport) {
    reasons.push("Youth employment support");
  }
  if (
    input.careRequestType === "therapy_assistance" &&
    input.participantUnder18
  ) {
    reasons.push("Therapy assistance for participant under 18");
  }
  if (
    input.careRequestType === "employment_support" &&
    input.participantUnder18
  ) {
    reasons.push("Employment support for participant under 18");
  }
  return reasons;
}

export function participantAgeFromDob(dateOfBirth: Date | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const m = today.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

export function isParticipantUnder18(dateOfBirth: Date | null | undefined): boolean {
  const age = participantAgeFromDob(dateOfBirth);
  return age !== null && age < 18;
}
