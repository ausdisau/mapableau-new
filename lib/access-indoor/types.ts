import type {
  AccessIndoorPoiType,
  AccessPlaceFeatureType,
} from "@prisma/client";

export type IndoorPoiView = {
  id: string;
  type: AccessIndoorPoiType;
  name: string;
  xNorm: number;
  yNorm: number;
  accessibleRouteOnly: boolean;
  featureType: AccessPlaceFeatureType | null;
  notes: string | null;
};

export type IndoorFloorView = {
  id: string;
  levelIndex: number;
  label: string;
  sortOrder: number;
  floorPlanImageUrl: string | null;
  imageBounds: unknown;
  vectorGeoJson: unknown;
  widthMeters: number | null;
  heightMeters: number | null;
  pois: IndoorPoiView[];
};

export type IndoorBuildingView = {
  id: string;
  name: string;
  positioningVendor: string;
  positioningEmbedUrl: string | null;
  externalVendorId: string | null;
  positioningEnabled: boolean;
  floors: IndoorFloorView[];
};

export type IndoorPlaceView = {
  placeId: string;
  buildings: IndoorBuildingView[];
};

export type IndoorRouteStep = {
  instruction: string;
  floorId: string;
  floorLabel: string;
  fromPoiId: string;
  toPoiId: string;
};

export type IndoorRouteView = {
  fromPoiId: string;
  toPoiId: string;
  totalWeight: number;
  steps: IndoorRouteStep[];
  segments: Array<{
    floorId: string;
    floorLabel: string;
    path: Array<{ x: number; y: number }>;
  }>;
};

export const INDOOR_POI_LABELS: Record<AccessIndoorPoiType, string> = {
  entrance: "Entrance",
  accessible_toilet: "Accessible toilet",
  changing_places: "Changing Places",
  lift: "Lift",
  ramp: "Ramp",
  stairs: "Stairs",
  help_point: "Help point",
  quiet_room: "Quiet room",
  parking: "Parking",
  reception: "Reception",
  other: "Point of interest",
};

export const ACCESSIBLE_INDOOR_POI_TYPES: AccessIndoorPoiType[] = [
  "entrance",
  "accessible_toilet",
  "changing_places",
  "lift",
  "ramp",
  "help_point",
  "quiet_room",
  "reception",
];
