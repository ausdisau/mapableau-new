import type {
  AccessEvidenceProvider,
  EvidenceRequest,
  EvidenceResult,
  NormalizedObservation,
  ProviderHealth,
} from "../contracts";
import { openInfrastructureFlags } from "../flags";
import { mapSensorThingsObservation, mapSensorThingsThing } from "./mapper";
import { sensorThingsObservationSchema } from "./schemas";

function readConfig() {
  return {
    baseUrl: process.env.MAPABLE_SENSORTHINGS_BASE_URL?.trim() ?? "",
  };
}

export class SensorThingsAdapter implements AccessEvidenceProvider {
  readonly providerId = "sensorthings" as const;

  isEnabled(): boolean {
    return openInfrastructureFlags.sensorthings && Boolean(readConfig().baseUrl);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const checkedAt = new Date().toISOString();
    const { baseUrl } = readConfig();
    if (!openInfrastructureFlags.sensorthings) {
      return {
        providerId: this.providerId,
        configured: Boolean(baseUrl),
        reachable: false,
        latencyMs: null,
        version: null,
        checkedAt,
        message: "SensorThings flag is OFF",
      };
    }
    if (!baseUrl) {
      return {
        providerId: this.providerId,
        configured: false,
        reachable: false,
        latencyMs: null,
        version: null,
        checkedAt,
        message: "MAPABLE_SENSORTHINGS_BASE_URL not configured",
      };
    }
    const started = Date.now();
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/v1.1`, {
        signal: AbortSignal.timeout(8000),
      });
      return {
        providerId: this.providerId,
        configured: true,
        reachable: res.ok,
        latencyMs: Date.now() - started,
        version: null,
        checkedAt: new Date().toISOString(),
        message: res.ok ? "SensorThings API reachable" : `HTTP ${res.status}`,
      };
    } catch (error) {
      return {
        providerId: this.providerId,
        configured: true,
        reachable: false,
        latencyMs: Date.now() - started,
        version: null,
        checkedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : "health failed",
      };
    }
  }

  async resolveEvidence(request: EvidenceRequest): Promise<EvidenceResult> {
    if (!this.isEnabled()) {
      throw new Error("SensorThings disabled");
    }
    return {
      providerId: this.providerId,
      references: [],
      rawSummary: `SensorThings reference ${request.reference}`,
    };
  }

  async normalizeObservation(input: unknown): Promise<NormalizedObservation> {
    if (!openInfrastructureFlags.enabled) {
      throw new Error("Open infrastructure disabled");
    }
    if (
      typeof input === "object" &&
      input != null &&
      "Datastreams" in input
    ) {
      const observations = mapSensorThingsThing(input);
      if (observations.length === 0) {
        throw new Error("Thing has no observations");
      }
      return observations[0];
    }
    sensorThingsObservationSchema.parse(input);
    return mapSensorThingsObservation(input);
  }
}

export const sensorThingsAdapter = new SensorThingsAdapter();
