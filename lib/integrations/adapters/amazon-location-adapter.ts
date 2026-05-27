import { isAmazonLocationEnabled } from "@/lib/amazon-location/config";
import type {
  IntegrationAdapter,
  IntegrationHealthResult,
} from "@/lib/integrations/integration-types";
import { accessGeoAutocomplete } from "@/lib/access-map/access-geocoding-service";

export const amazonLocationAdapter: IntegrationAdapter = {
  key: "amazon_location",
  type: "maps",
  displayName: "Amazon Location",

  isEnabled() {
    return isAmazonLocationEnabled();
  },

  async healthCheck(): Promise<IntegrationHealthResult> {
    if (!this.isEnabled()) {
      return { status: "degraded", message: "AMAZON_LOCATION_ENABLED is not true" };
    }
    try {
      const suggestions = await accessGeoAutocomplete("Sydney NSW");
      if (suggestions.length === 0) {
        return {
          status: "degraded",
          message: "Autocomplete returned no results for test query",
        };
      }
      return { status: "healthy", message: "geo-places autocomplete OK" };
    } catch (err) {
      return {
        status: "unhealthy",
        message: err instanceof Error ? err.message : "Health check failed",
      };
    }
  },
};
