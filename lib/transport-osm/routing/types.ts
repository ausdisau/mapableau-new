export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteRequest {
  coordinates: LatLng[];
  profile?: "driving-car" | "driving-hgv";
  wheelchairAccessible?: boolean;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline?: string;
  legs: Array<{
    from: LatLng;
    to: LatLng;
    distanceMeters: number;
    durationSeconds: number;
    encodedPolyline?: string;
  }>;
  provider: string;
  providerRequestId?: string;
}

export interface MatrixRequest {
  origins: LatLng[];
  destinations: LatLng[];
}

export interface MatrixResult {
  durationsSeconds: number[][];
  distancesMeters?: number[][];
  provider: string;
}

export interface RoutingProvider {
  readonly name: string;
  route(request: RouteRequest): Promise<RouteResult>;
  matrix(request: MatrixRequest): Promise<MatrixResult>;
}
