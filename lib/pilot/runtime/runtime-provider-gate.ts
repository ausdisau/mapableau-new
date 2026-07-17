export function assertProviderEligibleForPilot(input: {
  organisationId: string;
  pilotOrganisationId: string;
}): void {
  if (input.organisationId !== input.pilotOrganisationId) {
    throw new Error("PROVIDER_NOT_PILOT_ORGANISATION");
  }
}
