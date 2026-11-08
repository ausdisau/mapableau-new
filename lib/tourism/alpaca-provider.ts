/**
 * Alpaca Travel-shaped provider stub.
 *
 * Env placeholders (server-side only; never NEXT_PUBLIC_):
 *   ALPACA_GRAPHQL_ENDPOINT
 *   ALPACA_API_TOKEN
 *
 * This module does not import a GraphQL client and does not call the network.
 * MapAble access evidence stays independent of any itinerary POI payload.
 */
import type { TourismProvider } from "@/lib/tourism/provider";
import type { TourismPlace, TourismTrip } from "@/lib/tourism/types";

export const ALPACA_NOT_ENABLED_MESSAGE =
  "Alpaca Travel is not enabled — credentials, schema, and commercial rights are unverified.";

function notEnabled(): never {
  throw new Error(ALPACA_NOT_ENABLED_MESSAGE);
}

export class AlpacaTourismProvider implements TourismProvider {
  readonly isMock = false;
  readonly name = "AlpacaTourismProvider";

  async listPlaces(): Promise<TourismPlace[]> {
    return notEnabled();
  }

  async getPlace(_id: string): Promise<TourismPlace | null> {
    return notEnabled();
  }

  async getItinerary(_id: string): Promise<TourismTrip | null> {
    return notEnabled();
  }

  async createItinerary(_trip: TourismTrip): Promise<TourismTrip> {
    return notEnabled();
  }

  async updateItinerary(_trip: TourismTrip): Promise<TourismTrip> {
    return notEnabled();
  }
}

export const alpacaTourismProvider = new AlpacaTourismProvider();
