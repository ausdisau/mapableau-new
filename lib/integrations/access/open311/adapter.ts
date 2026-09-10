import type {
  AccessEvidenceProvider,
  EvidenceRequest,
  EvidenceResult,
  NormalizedObservation,
  ProviderHealth,
} from "../contracts";
import { createUnverifiedProvenance, normalizedObservationSchema } from "../contracts";
import { openInfrastructureFlags } from "../flags";
import {
  open311ServiceDiscoverySchema,
  open311ServiceRequestSchema,
  open311SubmitResponseSchema,
} from "./schemas";

export class Open311Error extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "Open311Error";
    this.status = status;
  }
}

function readConfig() {
  return {
    baseUrl: process.env.MAPABLE_OPEN311_BASE_URL?.trim() ?? "",
    apiKey: process.env.MAPABLE_OPEN311_API_KEY?.trim() ?? "",
  };
}

/** Stub service discovery — returns empty until city endpoint is configured. */
export async function discoverOpen311Services(): Promise<
  ReturnType<typeof open311ServiceDiscoverySchema.parse>
> {
  const { baseUrl } = readConfig();
  if (!baseUrl) {
    return open311ServiceDiscoverySchema.parse({ services: [] });
  }
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/services.json`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return open311ServiceDiscoverySchema.parse({ services: [] });
    }
    const json = await res.json();
    return open311ServiceDiscoverySchema.parse(json);
  } catch {
    return open311ServiceDiscoverySchema.parse({ services: [] });
  }
}

export function validateOpen311ServiceRequest(raw: unknown): void {
  open311ServiceRequestSchema.parse(raw);
}

/**
 * Submit to Open311 — only after explicit confirmation at civic layer.
 * This function refuses calls without `explicitHumanConfirmation`.
 */
export async function submitOpen311ServiceRequest(
  raw: unknown,
  options: { explicitHumanConfirmation: boolean },
): Promise<{ serviceRequestId: string | null }> {
  if (!options.explicitHumanConfirmation) {
    throw new Open311Error(
      "Autonomous Open311 submit refused — human confirmation required",
      403,
    );
  }
  if (!openInfrastructureFlags.open311) {
    throw new Open311Error("Open311 disabled", 404);
  }
  const payload = open311ServiceRequestSchema.parse(raw);
  const { baseUrl, apiKey } = readConfig();
  if (!baseUrl) {
    throw new Open311Error("MAPABLE_OPEN311_BASE_URL not configured", 503);
  }

  const body = new URLSearchParams();
  body.set("service_code", payload.service_code);
  body.set("description", payload.description);
  if (payload.lat != null) body.set("lat", String(payload.lat));
  if (payload.long != null) body.set("long", String(payload.long));

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/requests.json`, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Open311Error(`Open311 submit failed: ${res.status}`, res.status);
  }
  const json = await res.json();
  const parsed = open311SubmitResponseSchema.parse(json);
  const id = parsed.service_request_id;
  return {
    serviceRequestId: id != null ? String(id) : null,
  };
}

export class Open311Adapter implements AccessEvidenceProvider {
  readonly providerId = "open311" as const;

  isEnabled(): boolean {
    return openInfrastructureFlags.open311 && Boolean(readConfig().baseUrl);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const checkedAt = new Date().toISOString();
    const { baseUrl } = readConfig();
    if (!openInfrastructureFlags.open311) {
      return {
        providerId: this.providerId,
        configured: Boolean(baseUrl),
        reachable: false,
        latencyMs: null,
        version: null,
        checkedAt,
        message: "Open311 flag is OFF",
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
        message: "MAPABLE_OPEN311_BASE_URL not configured",
      };
    }
    const started = Date.now();
    try {
      const discovery = await discoverOpen311Services();
      return {
        providerId: this.providerId,
        configured: true,
        reachable: true,
        latencyMs: Date.now() - started,
        version: null,
        checkedAt: new Date().toISOString(),
        message: `${discovery.services.length} services discovered`,
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
      throw new Open311Error("Open311 disabled", 404);
    }
    return {
      providerId: this.providerId,
      references: [],
      rawSummary: `Open311 reference ${request.reference}`,
    };
  }

  async normalizeObservation(input: unknown): Promise<NormalizedObservation> {
    if (!openInfrastructureFlags.enabled) {
      throw new Open311Error("Open infrastructure disabled", 404);
    }
    const payload = open311ServiceRequestSchema.parse(input);
    const provenance = createUnverifiedProvenance({
      sourceProvider: "open311",
      sourceReference: `service:${payload.service_code}`,
      contributorType: "GOVERNMENT",
      attribution: "Open311 civic report",
    });
    return normalizedObservationSchema.parse({
      featureType: "civic_issue",
      attribute: "reported",
      value: true,
      valueQualifier: "EXPERIENCED",
      geometry:
        payload.lat != null && payload.long != null
          ? { type: "Point", coordinates: [payload.long, payload.lat] }
          : undefined,
      notes: payload.description,
      provenance: {
        ...provenance,
        sourceType: "open311_request",
        verificationState: "UNVERIFIED",
      },
      claimStrength: "observation",
    });
  }
}

export const open311Adapter = new Open311Adapter();
