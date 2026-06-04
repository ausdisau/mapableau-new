import { isAuspostPacLocationSearchAvailable } from "@/lib/config/auspost-pac";

/** How location autocomplete resolves suburbs/postcodes in Australia. */
export type LocationSearchProvider = "local_db" | "auspost_pac" | "aws_geo_places";

export const locationSearchConfig = {
  /** Primary AU postcode/suburb authority when PAC key + enrich flag are set. */
  get primaryAuProvider(): LocationSearchProvider {
    if (isAuspostPacLocationSearchAvailable()) return "auspost_pac";
    return "local_db";
  },
  /** Future: set AWS_LOCATION_ENABLED=true and wire aws-location-adapter. */
  get awsPlacesEnabled() {
    return process.env.AWS_LOCATION_ENABLED === "true";
  },
};
