/**
 * NT DLI bus GTFS static configuration (Darwin + Alice Springs).
 * https://dli.nt.gov.au/data/bus-timetable-data-and-geographic-information
 */
export const ntTransportConfig = {
  get enabled() {
    return process.env.NT_GTFS_ENABLED !== "false";
  },
  get gtfsUrls() {
    const darwin =
      process.env.NT_GTFS_DARWIN_URL ??
      "https://dipl.nt.gov.au/data-feeds/bus-gtfs/google-transit-darwin.zip";
    const aliceSprings =
      process.env.NT_GTFS_ALICE_SPRINGS_URL ??
      "https://dipl.nt.gov.au/data-feeds/bus-gtfs/google-transit-alice-springs.zip";
    return [darwin, aliceSprings];
  },
  get refreshHours() {
    return Number(process.env.NT_GTFS_REFRESH_HOURS ?? "24");
  },
};

export function isNtTransportAvailable(): boolean {
  return ntTransportConfig.enabled;
}
