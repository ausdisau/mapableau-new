/**
 * Transperth / PTA (WA) GTFS static configuration.
 * https://www.transperth.wa.gov.au/About/Spatial-Data-Access
 */
export const transperthConfig = {
  get enabled() {
    return process.env.WA_GTFS_ENABLED !== "false";
  },
  get gtfsUrl() {
    return (
      process.env.WA_GTFS_URL ??
      "https://www.transperth.wa.gov.au/TimetablePDFs/GoogleTransit/Production/google_transit.zip"
    );
  },
  get refreshHours() {
    return Number(process.env.WA_GTFS_REFRESH_HOURS ?? "24");
  },
};

export function isTransperthAvailable(): boolean {
  return transperthConfig.enabled;
}
