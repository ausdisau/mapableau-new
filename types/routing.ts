export type RoutingCoordinate = { lat: number; lng: number };

export type RoutingStopRef =
  | { type: "coordinate"; lat: number; lng: number }
  | { type: "participant_location"; id: string }
  | { type: "service_site"; id: string };

export type RouteLeg = {
  fromIndex: number;
  toIndex: number;
  durationSeconds: number;
  distanceMeters: number;
};

export type RouteResult = {
  geometryGeoJson: GeoJSON.LineString | null;
  legs: RouteLeg[];
  totalDurationSeconds: number;
  totalDistanceMeters: number;
  source: string;
};

export type MatrixCell = {
  fromIndex: number;
  toIndex: number;
  durationSeconds: number;
  distanceMeters: number;
};
