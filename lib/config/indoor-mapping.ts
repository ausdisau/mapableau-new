import type { AccessIndoorPositioningVendor } from "@prisma/client";

export type IndoorPositioningConfig = {
  vendor: AccessIndoorPositioningVendor;
  embedUrl?: string;
  externalVendorId?: string;
};

const vendorFromEnv = (): AccessIndoorPositioningVendor => {
  const raw = process.env.INDOOR_POSITIONING_VENDOR?.trim().toLowerCase();
  const allowed: AccessIndoorPositioningVendor[] = [
    "none",
    "bindimaps",
    "mapsindoors",
    "mappedin",
    "arcgis_indoors",
    "custom",
  ];
  if (raw && allowed.includes(raw as AccessIndoorPositioningVendor)) {
    return raw as AccessIndoorPositioningVendor;
  }
  return "none";
};

/** Platform default when a building has no vendor override. */
export function getDefaultIndoorPositioningVendor(): AccessIndoorPositioningVendor {
  return vendorFromEnv();
}

export function resolveBuildingPositioning(building: {
  positioningVendor: AccessIndoorPositioningVendor;
  positioningEmbedUrl: string | null;
  externalVendorId: string | null;
}): IndoorPositioningConfig {
  const vendor =
    building.positioningVendor === "none"
      ? getDefaultIndoorPositioningVendor()
      : building.positioningVendor;

  return {
    vendor,
    embedUrl: building.positioningEmbedUrl ?? undefined,
    externalVendorId: building.externalVendorId ?? undefined,
  };
}

export function isIndoorPositioningEnabled(config: IndoorPositioningConfig): boolean {
  return config.vendor !== "none" && Boolean(config.embedUrl || config.externalVendorId);
}
