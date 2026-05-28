import { isGoogleMapsConfigured } from "@/lib/geocoding/google-config";
import { pingGoogleGeocoding } from "@/lib/geocoding/google-geocoding-client";
import type {
  IntegrationAdapter,
  IntegrationHealthResult,
} from "@/lib/integrations/integration-types";

export const googleMapsAdapter: IntegrationAdapter = {
  key: "google_maps",
  type: "maps",
  displayName: "Google Maps",

  isEnabled() {
    return isGoogleMapsConfigured();
  },

  async healthCheck(): Promise<IntegrationHealthResult> {
    if (!isGoogleMapsConfigured()) {
      return { status: "degraded", message: "Google Maps not configured" };
    }

    const ping = await pingGoogleGeocoding();
    if (ping.ok) {
      return { status: "healthy", message: ping.message };
    }
    return { status: "degraded", message: ping.message };
  },
};
