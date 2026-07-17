export function accreditationClaimIsLiveStatus(): false {
  return false;
}

export function buildPublicAccreditationClaim(
  level: string,
  expiresAt?: Date | null,
): string {
  return expiresAt
    ? `${level} accreditation until ${expiresAt.toISOString()}`
    : `${level} accreditation`;
}
