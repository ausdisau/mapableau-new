export function materialJourneyChangeRequiresApproval(input: {
  addedTransfers: number;
  removedCriticalAsset: boolean;
}): boolean {
  return input.addedTransfers > 0 || input.removedCriticalAsset;
}
