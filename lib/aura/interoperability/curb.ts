export type AuraCurbZone = {
  id: string;
  label: string;
  zoneType: "passenger_loading" | "accessible_parking" | "temporary_drop_off";
  sideUnloading?: "side" | "rear" | "both";
  maxVehicleLengthM?: number;
  kerbRamp: boolean | "unknown";
  operatingHours?: string;
  closed: boolean;
};

export type AuraCurbCompatibilityRequest = {
  vehicleLengthM: number;
  rampSide: "side" | "rear";
  hoistPresent?: boolean;
  mobilityDeviceWidthMm?: number;
  maxAcceptableDistanceM?: number;
};

export type AuraCurbCompatibilityResult = {
  zoneId: string;
  compatible: boolean;
  reasons: string[];
  verified: boolean;
};

export interface AuraCurbDataAdapter {
  readonly adapterId: string;
  importZones(sourceId: string): Promise<{ zones: AuraCurbZone[] }>;
  readZoneState(zoneId: string): Promise<AuraCurbZone | null>;
  listCompatibleZones(
    input: AuraCurbCompatibilityRequest,
  ): Promise<AuraCurbCompatibilityResult[]>;
}

export const fixtureCurbAdapter: AuraCurbDataAdapter = {
  adapterId: "aura-curb-fixture",
  async importZones() {
    return {
      zones: [
        {
          id: "curb-harbour-plz",
          label: "Harbour Civic loading zone",
          zoneType: "passenger_loading",
          sideUnloading: "rear",
          maxVehicleLengthM: 8,
          kerbRamp: true,
          closed: false,
        },
      ],
    };
  },
  async readZoneState(zoneId) {
    const { zones } = await this.importZones("fixture");
    return zones.find((z) => z.id === zoneId) ?? null;
  },
  async listCompatibleZones(input) {
    const { zones } = await this.importZones("fixture");
    return zones.map((z) => {
      if (z.closed) {
        return { zoneId: z.id, compatible: false, reasons: ["Zone closed"], verified: true };
      }
      const reasons: string[] = [];
      let compatible = true;
      if (input.rampSide === "side" && z.sideUnloading === "rear") {
        compatible = false;
        reasons.push("Rear ramp required; zone supports rear unloading only");
      }
      if (input.rampSide === "rear" && z.sideUnloading === "side") {
        compatible = false;
        reasons.push("Side ramp required; zone supports side unloading only");
      }
      if (z.maxVehicleLengthM && input.vehicleLengthM > z.maxVehicleLengthM) {
        compatible = false;
        reasons.push("Vehicle too long for zone");
      }
      if (z.kerbRamp === "unknown") {
        reasons.push("Kerb ramp accessibility unknown");
      }
      return { zoneId: z.id, compatible, reasons, verified: z.kerbRamp !== "unknown" };
    });
  },
};
