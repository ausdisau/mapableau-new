/** Read-only MapAble One provider operations overview; not a booking or ledger writer. */
export function isMapAbleOneOperationsHubEnabled(): boolean {
  return process.env.MAPABLE_ONE_OPERATIONS_HUB_ENABLED === "true";
}
