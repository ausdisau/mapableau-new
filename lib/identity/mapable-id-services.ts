/**
 * MapAbleID connected and planned services.
 * ProviderCloud is a hosted surface (cloud.mapable.com.au), not a premium SKU.
 */
export const MAPABLE_ID_SERVICES = [
  { id: "mapable", title: "MapAble", status: "connected" as const },
  { id: "providercloud", title: "ProviderCloud", status: "connected" as const },
  { id: "accessibooks", title: "AccessiBooks", status: "planned" as const },
  { id: "cripsquare", title: "CripSquare", status: "planned" as const },
] as const;
