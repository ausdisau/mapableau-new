import type { TourismPlace, TourismTrip } from "@/lib/tourism/types";

export type TourismProvider = {
  readonly isMock: boolean;
  readonly name: string;
  listPlaces(): Promise<TourismPlace[]>;
  getPlace(id: string): Promise<TourismPlace | null>;
  getItinerary(id: string): Promise<TourismTrip | null>;
  createItinerary(trip: TourismTrip): Promise<TourismTrip>;
  updateItinerary(trip: TourismTrip): Promise<TourismTrip>;
};
