/** Provider registration context used by claim-path resolution. */
export type ProviderRegistrationContext = {
  /** Organisation has claimed NDIS registration in MapAble. */
  claimed: boolean;
  /** Registration number on file (non-empty when present). */
  registrationNumber: string | null;
  /** Registration is treated as currently active for claiming. */
  active: boolean;
};

export function isRegisteredProviderActive(
  registration: ProviderRegistrationContext
): boolean {
  return (
    registration.claimed &&
    registration.active &&
    Boolean(registration.registrationNumber?.trim())
  );
}
