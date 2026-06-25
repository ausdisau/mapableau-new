import type { AccessibleDestinationProfile } from "@/types/access-transport";
import type { JourneyConfidenceScore } from "@/types/access-transport";

export function computeJourneyConfidence(params: {
  destinationProfile: AccessibleDestinationProfile;
  hasMobilityPrefill?: boolean;
}): JourneyConfidenceScore {
  const dest = params.destinationProfile.accessSummary;
  const destinationConfidence = dest.confidenceScore ?? 30;
  const alertCount = dest.activeAlerts.length;
  const alertPenalty = Math.min(100, alertCount * 20);
  const dropoffConfidence =
    params.destinationProfile.accessWarnings.length > 0 ? 50 : 80;

  const vehicleFitConfidence = params.hasMobilityPrefill ? 75 : 60;
  const routeConfidence = 70;

  const overallJourneyConfidence = Math.round(
    (destinationConfidence * 0.35 +
      dropoffConfidence * 0.25 +
      vehicleFitConfidence * 0.2 +
      routeConfidence * 0.1 +
      (100 - alertPenalty) * 0.1) *
      10
  ) / 10;

  return {
    routeConfidence,
    destinationConfidence,
    vehicleFitConfidence,
    dropoffConfidence,
    liveAlertRisk: alertPenalty,
    overallJourneyConfidence,
  };
}
