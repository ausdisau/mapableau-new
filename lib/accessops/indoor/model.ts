import type { JsonObject } from "../types";

export interface IndoorAccessModel {
  version: string;
  checksum: string;
  nodes: JsonObject[];
  edges: JsonObject[];
  restrictedZoneIds: string[];
}
