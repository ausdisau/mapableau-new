/** MapLibre source identifiers (GeoJSON sources). */
export const MAP_SOURCE_IDS = {
  transportTrips: "transport-trips",
  accessPlaces: "access-places",
  careShifts: "care-shifts",
  transportStops: "transport-stops",
  providers: "providers",
  userLocation: "user-location",
} as const;

/** MapLibre layer identifiers (style layers). */
export const MAP_LAYER_IDS = {
  transportTrips: "transport-trips-layer",
  accessPlaces: "access-places-layer",
  careShifts: "care-shifts-layer",
  pickupPoints: "pickup-points-layer",
  providers: "providers-layer",
  userLocation: "user-location-layer",
  reviews: "reviews-layer",
  sponsored: "sponsored-services-layer",
  dispatchVehicles: "dispatch-vehicles-layer",
} as const;
