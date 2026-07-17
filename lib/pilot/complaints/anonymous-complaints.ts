export function shouldMaskComplainant(anonymous: boolean): boolean {
  return anonymous;
}

export function anonymousComplaintDisplayName(anonymous: boolean): string {
  return anonymous ? "Anonymous complainant" : "Named complainant";
}
