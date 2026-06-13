/** Entity kinds rendered on MapAble maps. */
export type MapEntityKind = "provider" | "access_place" | "user";

export type MapPointEntity = {
  id: string;
  kind: MapEntityKind;
  name: string;
  lat: number;
  lng: number;
  subtitle?: string;
  layerId?: string;
};

export type MapPointFeatureProperties = {
  kind: MapEntityKind;
  id: string;
  name: string;
  subtitle?: string;
  layerId?: string;
};

export type MapPointFeature = GeoJSON.Feature<
  GeoJSON.Point,
  MapPointFeatureProperties
>;

export type MapFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  MapPointFeatureProperties
>;

export type MapLineFeature = GeoJSON.Feature<
  GeoJSON.LineString,
  MapPointFeatureProperties
>;

export type MapPolygonFeature = GeoJSON.Feature<
  GeoJSON.Polygon,
  MapPointFeatureProperties
>;

export type MapMixedFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon,
  MapPointFeatureProperties
>;
