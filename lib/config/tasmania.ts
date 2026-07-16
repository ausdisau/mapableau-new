/**
 * Tasmania Department of State Growth GTFS static configuration.
 * https://www.transport.tas.gov.au/public_transport/gtfs-data
 */
export const tasmaniaConfig = {
  get enabled() {
    return process.env.TAS_GTFS_ENABLED !== "false";
  },
  get gtfsUrl() {
    return (
      process.env.TAS_GTFS_URL ??
      "https://www.transport.tas.gov.au/__data/assets/file/0011/557615/GTFS_240425_Tasmania_post.zip"
    );
  },
  get refreshHours() {
    return Number(process.env.TAS_GTFS_REFRESH_HOURS ?? "24");
  },
};

export function isTasmaniaAvailable(): boolean {
  return tasmaniaConfig.enabled;
}
