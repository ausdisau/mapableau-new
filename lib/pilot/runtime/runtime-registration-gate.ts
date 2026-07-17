export function assertRegistrationAllowsPilotStage(input: {
  ndisRegistrationClaimed: boolean;
  stage: string;
}): void {
  if (
    (input.stage === "limited_live" || input.stage === "controlled_live") &&
    !input.ndisRegistrationClaimed
  ) {
    throw new Error("NDIS_REGISTRATION_REQUIRED_FOR_LIVE_STAGE");
  }
}
