import { makeSydneyDemoTrip } from "@/lib/tourism/planner";
import type { TourismProvider } from "@/lib/tourism/provider";
import { SYDNEY_TOURISM_PLACES } from "@/lib/tourism/sydney-dataset";
import {
  getTourismPlace,
  isTourismTrip,
  migrateTourismTrip,
} from "@/lib/tourism/trip-ops";
import type { TourismPlace, TourismTrip } from "@/lib/tourism/types";

const trips = new Map<string, TourismTrip>();

export class MockTourismProvider implements TourismProvider {
  readonly isMock = true;
  readonly name = "MockTourismProvider";

  async listPlaces(): Promise<TourismPlace[]> {
    return SYDNEY_TOURISM_PLACES;
  }

  async getPlace(id: string): Promise<TourismPlace | null> {
    return getTourismPlace(id) ?? null;
  }

  async getItinerary(id: string): Promise<TourismTrip | null> {
    if (id !== "sydney-demo") return null;
    return trips.get(id) ?? makeSydneyDemoTrip();
  }

  async createItinerary(trip: TourismTrip): Promise<TourismTrip> {
    if (!isTourismTrip(trip)) {
      throw new Error("Invalid illustrative itinerary");
    }
    const next = migrateTourismTrip(trip) ?? makeSydneyDemoTrip();
    trips.set(next.id, next);
    return next;
  }

  async updateItinerary(trip: TourismTrip): Promise<TourismTrip> {
    return this.createItinerary(trip);
  }
}

export const mockTourismProvider = new MockTourismProvider();
