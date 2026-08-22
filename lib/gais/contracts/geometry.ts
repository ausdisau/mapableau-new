/** GeoJSON-compatible geometry (RFC 7946). */

export type GaisPoint = {
  type: "Point";
  coordinates: [number, number];
};

export type GaisLineString = {
  type: "LineString";
  coordinates: [number, number][];
};

export type GaisPolygon = {
  type: "Polygon";
  coordinates: [number, number][][];
};

export type GaisGeometry = GaisPoint | GaisLineString | GaisPolygon;
