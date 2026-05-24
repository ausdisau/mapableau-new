/** Stable MapLibre source and layer identifiers. */

export const MAP_SOURCES = {
  providers: "providers-source",
  userLocation: "user-location-source",
  sponsoredServices: "sponsored-services-source",
  accessibilityPlaces: "accessibility-places-source",
  reviews: "reviews-source",
  pickupPoints: "pickup-points-source",
  transportTrips: "transport-trips-source",
  dispatchVehicles: "dispatch-vehicles-source",
  serviceZones: "service-zones-source",
} as const;

export const MAP_LAYERS = {
  providersCircle: "providers-circle-layer",
  providersSymbol: "providers-symbol-layer",
  providersSelected: "providers-selected-layer",
  userLocation: "user-location-layer",
  sponsoredServicesCircle: "sponsored-services-circle-layer",
  sponsoredServicesSymbol: "sponsored-services-symbol-layer",
  accessibilityPlaces: "accessibility-places-circle-layer",
  reviews: "reviews-symbol-layer",
  pickupPoints: "pickup-points-circle-layer",
  pickupPointsSymbol: "pickup-points-symbol-layer",
  transportTripsLine: "transport-trips-line-layer",
  transportTripsPoints: "transport-trips-points-layer",
  dispatchVehicles: "dispatch-vehicles-symbol-layer",
  serviceZonesFill: "service-zones-fill-layer",
  serviceZonesOutline: "service-zones-outline-layer",
} as const;

export type MapFeatureKind =
  | "provider"
  | "sponsored"
  | "accessibility_place"
  | "review"
  | "pickup_point"
  | "vehicle"
  | "trip"
  | "service_zone"
  | "user_location";

export const INTERACTIVE_LAYERS = [
  MAP_LAYERS.providersCircle,
  MAP_LAYERS.providersSymbol,
  MAP_LAYERS.sponsoredServicesCircle,
  MAP_LAYERS.sponsoredServicesSymbol,
  MAP_LAYERS.accessibilityPlaces,
  MAP_LAYERS.reviews,
  MAP_LAYERS.pickupPoints,
  MAP_LAYERS.pickupPointsSymbol,
  MAP_LAYERS.dispatchVehicles,
  MAP_LAYERS.transportTripsPoints,
  MAP_LAYERS.serviceZonesFill,
] as const;
