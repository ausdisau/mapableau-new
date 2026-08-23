export type {
  GaisArrivalFeature,
  GaisArrivalFeatureKind,
  GaisDestinationPlace,
  GaisDestinationResolution,
} from "./types";
export { GAIS_ARRIVAL_FEATURE_KINDS } from "./types";
export {
  ARRIVAL_FEATURE_TAGS,
  arrivalFeatureLabel,
  arrivalKindFromFeatureTag,
} from "./labels";
export {
  mapPlaceFeatureToArrivalFeature,
  resolveDestinationFromPlace,
} from "./resolve";
export {
  resolveDestinationByPlaceId,
  resolveDestinationByQuery,
} from "./service";
