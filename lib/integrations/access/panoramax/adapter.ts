import type {
  AccessEvidenceProvider,
  EvidenceRequest,
  EvidenceResult,
  NormalizedObservation,
  ProviderHealth,
} from "../contracts";
import { openInfrastructureFlags } from "../flags";
import { createPanoramaxClient } from "./client";
import { PanoramaxError } from "./errors";
import { mapPanoramaxItemToObservation } from "./mapper";

function readConfig() {
  const baseUrl = process.env.MAPABLE_PANORAMAX_BASE_URL?.trim() ?? "";
  const allowedHosts = (process.env.MAPABLE_PANORAMAX_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  return { baseUrl, allowedHosts };
}

export class PanoramaxAdapter implements AccessEvidenceProvider {
  readonly providerId = "panoramax" as const;

  isEnabled(): boolean {
    return openInfrastructureFlags.panoramax && Boolean(readConfig().baseUrl);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const checkedAt = new Date().toISOString();
    const { baseUrl, allowedHosts } = readConfig();
    if (!openInfrastructureFlags.panoramax) {
      return {
        providerId: this.providerId,
        configured: Boolean(baseUrl),
        reachable: false,
        latencyMs: null,
        version: null,
        checkedAt,
        message: "Panoramax flag is OFF",
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
        message: "MAPABLE_PANORAMAX_BASE_URL not configured",
      };
    }
    const started = Date.now();
    try {
      const client = createPanoramaxClient({ baseUrl, allowedHosts });
      const root = await client.getApiRoot();
      return {
        providerId: this.providerId,
        configured: true,
        reachable: true,
        latencyMs: Date.now() - started,
        version: root.version ?? root.stac_version ?? null,
        checkedAt: new Date().toISOString(),
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
      throw new PanoramaxError("DISABLED", "Panoramax disabled", 404);
    }
    const { baseUrl, allowedHosts } = readConfig();
    const client = createPanoramaxClient({ baseUrl, allowedHosts });
    const item = await client.getItem(request.reference);
    const observation = mapPanoramaxItemToObservation(item, {
      allowedHosts,
      sourceBaseUrl: baseUrl,
    });
    return {
      providerId: this.providerId,
      references: observation.provenance.evidenceRefs,
      rawSummary: `Panoramax item ${request.reference}`,
    };
  }

  async normalizeObservation(input: unknown): Promise<NormalizedObservation> {
    if (!openInfrastructureFlags.enabled) {
      throw new PanoramaxError("DISABLED", "Open infrastructure disabled", 404);
    }
    const { baseUrl, allowedHosts } = readConfig();
    return mapPanoramaxItemToObservation(input, {
      allowedHosts,
      sourceBaseUrl: baseUrl || undefined,
    });
  }
}

export const panoramaxAdapter = new PanoramaxAdapter();
