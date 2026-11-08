/**
 * Compatibility barrel for the Sydney tourism demo and OpenTripMap helpers.
 */
export { makeSydneyDemoTrip } from "@/lib/tourism/planner";
export { SYDNEY_TOURISM_PLACES } from "@/lib/tourism/sydney-dataset";
export {
  addOpenTripMapStop,
  addTourismStop,
  getTourismPlace,
  getTourismPlaceInTrip,
  isTourismTrip,
  moveTourismStop,
  removeTourismStop,
} from "@/lib/tourism/trip-ops";
export {
  TOURISM_NEEDS,
  TOURISM_TRIP_STORAGE_KEY,
  type AccessFeature,
  type TourismNeed,
  type TourismPlace,
  type TourismTrip,
  type TripDay as TourismTripDay,
} from "@/lib/tourism/types";
