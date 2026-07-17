import {
  appendFeatureObservation,
  type AppendFeatureObservationInput,
} from "../features/observation-service";

export async function submitCommunityCorrection(
  input: AppendFeatureObservationInput,
) {
  return appendFeatureObservation({
    ...input,
    observationMethod: "community_report",
    evidenceLevel: "community_observed",
  });
}
