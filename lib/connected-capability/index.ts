export * from "./evidence";
export * from "./handoff";
export * from "./contracts";
export * from "./taylor-fixture";

export const CONNECTED_CAPABILITY_SOURCE_VERSION =
  "connected-capability/0.1.0";

export const PROGRAMME_NAME = "MAPABLE CONNECTED CAPABILITY PROGRAMME";

export const PUBLIC_POSITIONING = "Care and support, connected.";

/** Public product names — never describe MapAble to participants as an OS. */
export const PUBLIC_PRODUCT_NAMES = {
  communications: "MapAble Communication",
  communicationPassport: "Communication Passport",
  workforce: "MapAble Workforce",
  academy: "MapAble Academy",
  equipment: "MapAble Equipment",
  companion: "MapAble Companion",
  outcomes: "MapAble Outcomes",
  provider: "MapAble Provider",
  capacity: "MapAble Capacity",
  developers: "MapAble Developers",
} as const;
