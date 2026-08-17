import type { TwinPlace } from "@/lib/digital-twin/types";

export interface CreateTwinPlaceInput {
  name: string;
  slug: string;
  placeType: TwinPlace["placeType"];
  description?: string;
  address: string;
  region: string;
  geo: { lat: number; lng: number };
  privacy?: TwinPlace["privacy"];
}
