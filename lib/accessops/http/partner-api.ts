import { z } from "zod";

import { appendFeatureObservation } from "@/lib/accessops/features/observation-service";
import { hashPartnerApiKey, requireAccessOpsPartnerScopes } from "@/lib/accessops/partners/api-auth";
import { toPartnerAssetDto } from "@/lib/accessops/partners/dto";
import { validateWebhookDestination } from "@/lib/accessops/partners/webhooks";
import { isAccessOpsFeatureEnabled } from "@/lib/accessops/feature-flags";
import { appendStatusEvent } from "@/lib/accessops/status/status-event-service";
import { projectOperationalStatus } from "@/lib/accessops/status/status-projection";
import { mapAccessAssetDto } from "@/lib/accessops/types";
import { asJsonArray } from "@/lib/prisma-json";
import { prisma } from "@/lib/prisma";

import {
  toFeatureObservationDto,
  toIncidentDto,
  toReliabilityMeasurementDto,
  toStatusEventDto,
} from "./dto";
import {
  accessOpsError,
  accessOpsJson,
  accessOpsSafe,
  parseJsonBody,
  readIdempotencyKey,
} from "./route-guards";

const limitSchema = z.coerce.number().int().min(1).max(200).default(50);
const jsonObjectSchema = z.record(z.string(), z.unknown());

const featureObservationSchema = z.object({
  assetId: z.string().min(1),
  featureType: z.enum([
    "step_free_access",
    "wheelchair_access",
    "mobility_device_access",
    "level_entry",
    "ramp_access",
    "lift_access",
    "automatic_door",
    "door_clearance",
    "corridor_clearance",
    "turning_space",
    "accessible_toilet",
    "changing_place",
    "accessible_parking",
    "accessible_drop_off",
    "accessible_boarding",
    "tactile_guidance",
    "braille_signage",
    "hearing_loop",
    "captioning",
    "quiet_space",
    "sensory_support",
    "visual_alarm",
    "audio_guidance",
    "staff_assistance",
    "assistance_animal_access",
    "accessible_service_counter",
    "seating",
    "rest_point",
    "lighting",
    "surface_quality",
    "gradient",
    "crossfall",
    "kerb_height",
    "other",
  ]),
  observedValue: jsonObjectSchema,
  sourceType: z.string().min(1).default("partner"),
  observedAt: z.coerce.date().default(() => new Date()),
  unit: z.string().optional().nullable(),
  sourceReference: z.string().optional().nullable(),
  safeNotes: z.string().max(2000).optional().nullable(),
});

const statusEventSchema = z.object({
  assetId: z.string().min(1),
  state: z.enum([
    "unknown",
    "reported_available",
    "verified_available",
    "degraded",
    "partially_available",
    "temporarily_unavailable",
    "scheduled_unavailable",
    "under_maintenance",
    "permanently_removed",
    "status_conflict",
    "stale",
    "test_only",
  ]),
  safeDescription: z.string().min(1).max(2000),
  observedAt: z.coerce.date().default(() => new Date()),
  expectedUntil: z.coerce.date().optional().nullable(),
  confidence: z.number().min(0).max(1).optional(),
  externalEventId: z.string().optional().nullable(),
});

const webhookSchema = z.object({
  destinationUrl: z.string().url(),
  allowlistedHost: z.string().min(1),
  eventTypes: z.array(z.string().min(1)).min(1),
  secret: z.string().min(16),
});

export async function handlePartnerAssetsGet(request: Request): Promise<Response> {
  const partner = await requireAccessOpsPartnerScopes(request, ["assets:read"]);
  if (partner instanceof Response) return partner;
  const limit = limitSchema.parse(new URL(request.url).searchParams.get("limit") ?? 50);
  return accessOpsSafe(async () => {
    const assets = await prisma.accessAsset.findMany({
      where: {
        tenantId: partner.tenantId,
        securityClassification: "public",
        publicVisibility: "public",
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return {
      assets: assets.map((asset) => toPartnerAssetDto(mapAccessAssetDto(asset))),
    };
  });
}

export async function handlePartnerFeaturesGet(request: Request): Promise<Response> {
  const partner = await requireAccessOpsPartnerScopes(request, ["features:read"]);
  if (partner instanceof Response) return partner;
  const url = new URL(request.url);
  const assetId = url.searchParams.get("assetId");
  const limit = limitSchema.parse(url.searchParams.get("limit") ?? 50);
  return accessOpsSafe(async () => {
    const observations = await prisma.accessFeatureObservation.findMany({
      where: {
        ...(assetId ? { assetId } : {}),
        asset: { tenantId: partner.tenantId, securityClassification: "public" },
      },
      orderBy: { observedAt: "desc" },
      take: limit,
    });
    return { observations: observations.map(toFeatureObservationDto) };
  });
}

export async function handlePartnerStatusGet(request: Request): Promise<Response> {
  const partner = await requireAccessOpsPartnerScopes(request, ["status:read"]);
  if (partner instanceof Response) return partner;
  const url = new URL(request.url);
  const assetId = url.searchParams.get("assetId");
  return accessOpsSafe(async () => {
    const events = await prisma.accessStatusEvent.findMany({
      where: {
        ...(assetId ? { assetId } : {}),
        asset: { tenantId: partner.tenantId, securityClassification: "public" },
      },
      orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
      take: 100,
    });
    return {
      status: assetId ? projectOperationalStatus(events) : undefined,
      events: events.map(toStatusEventDto),
    };
  });
}

export async function handlePartnerStatusWrite(request: Request): Promise<Response> {
  const partner = await requireAccessOpsPartnerScopes(request, ["status:write"]);
  if (partner instanceof Response) return partner;
  const parsed = await parseJsonBody(request, statusEventSchema);
  if ("response" in parsed) return parsed.response;
  const idempotencyKey = readIdempotencyKey(request);
  return accessOpsSafe(async () => {
    const asset = await prisma.accessAsset.findFirst({
      where: { id: parsed.data.assetId, tenantId: partner.tenantId },
      select: { id: true },
    });
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    return {
      event: toStatusEventDto(
        await appendStatusEvent({
          assetId: parsed.data.assetId,
          state: parsed.data.state,
          sourceType: "import_feed",
          safeDescription: parsed.data.safeDescription,
          observedAt: parsed.data.observedAt,
          evidenceLevel: "operator_reported",
          reasonCode: "unknown",
          expectedUntil: parsed.data.expectedUntil,
          confidence: parsed.data.confidence,
          externalEventId: parsed.data.externalEventId ?? idempotencyKey,
          correlationId: idempotencyKey ?? undefined,
        }),
      ),
      idempotencyKey,
    };
  });
}

export async function handlePartnerIncidentsGet(request: Request): Promise<Response> {
  const partner = await requireAccessOpsPartnerScopes(request, ["incidents:read"]);
  if (partner instanceof Response) return partner;
  const limit = limitSchema.parse(new URL(request.url).searchParams.get("limit") ?? 50);
  return accessOpsSafe(async () => {
    const incidents = await prisma.accessOpsIncident.findMany({
      where: { asset: { tenantId: partner.tenantId } },
      orderBy: { reportedAt: "desc" },
      take: limit,
    });
    return { incidents: incidents.map(toIncidentDto) };
  });
}

export async function handlePartnerReliabilityGet(request: Request): Promise<Response> {
  const partner = await requireAccessOpsPartnerScopes(request, ["reliability:read"]);
  if (partner instanceof Response) return partner;
  const limit = limitSchema.parse(new URL(request.url).searchParams.get("limit") ?? 50);
  return accessOpsSafe(async () => {
    const measurements = await prisma.accessReliabilityMeasurement.findMany({
      where: { asset: { tenantId: partner.tenantId, securityClassification: "public" } },
      orderBy: { windowEnd: "desc" },
      take: limit,
    });
    return { reliability: measurements.map(toReliabilityMeasurementDto) };
  });
}

export async function handlePartnerObservationPost(request: Request): Promise<Response> {
  const partner = await requireAccessOpsPartnerScopes(request, ["observations:write"]);
  if (partner instanceof Response) return partner;
  const parsed = await parseJsonBody(request, featureObservationSchema);
  if ("response" in parsed) return parsed.response;
  return accessOpsSafe(async () => {
    const asset = await prisma.accessAsset.findFirst({
      where: { id: parsed.data.assetId, tenantId: partner.tenantId },
      select: { id: true },
    });
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    return {
      observation: toFeatureObservationDto(
        await appendFeatureObservation({
          ...parsed.data,
          evidenceLevel: "operator_reported",
          observationMethod: "structured_feed",
        }),
      ),
    };
  });
}

export async function handlePartnerWebhooksGet(request: Request): Promise<Response> {
  const partner = await requireAccessOpsPartnerScopes(request, ["webhooks:write"]);
  if (partner instanceof Response) return partner;
  return accessOpsSafe(async () => {
    const webhooks = await prisma.accessOpsWebhookSubscription.findMany({
      where: { tenantId: partner.tenantId, clientId: partner.clientId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        destinationUrl: true,
        eventTypes: true,
        status: true,
        allowlistedHost: true,
        createdAt: true,
      },
    });
    return { webhooks };
  });
}

export async function handlePartnerWebhooksPost(request: Request): Promise<Response> {
  const partner = await requireAccessOpsPartnerScopes(request, ["webhooks:write"]);
  if (partner instanceof Response) return partner;
  const parsed = await parseJsonBody(request, webhookSchema);
  if ("response" in parsed) return parsed.response;
  const destination = validateWebhookDestination(
    parsed.data.destinationUrl,
    parsed.data.allowlistedHost,
  );
  if (!destination.allowed) {
    return accessOpsError("WEBHOOK_DESTINATION_BLOCKED", destination.reason, 400);
  }
  const eventTypes = asJsonArray(parsed.data.eventTypes);
  if (!eventTypes) return accessOpsError("WEBHOOK_EVENTS_REQUIRED", "Invalid events.", 400);
  return accessOpsSafe(async () => {
    const webhook = await prisma.accessOpsWebhookSubscription.create({
      data: {
        tenantId: partner.tenantId,
        clientId: partner.clientId,
        destinationUrl: parsed.data.destinationUrl,
        eventTypes,
        secretHash: hashPartnerApiKey(parsed.data.secret),
        secretHint: parsed.data.secret.slice(-6),
        allowlistedHost: parsed.data.allowlistedHost,
        status: isAccessOpsFeatureEnabled("ACCESSOPS_WEBHOOKS_PRODUCTION_ENABLED")
          ? "active"
          : "disabled",
      },
      select: {
        id: true,
        destinationUrl: true,
        eventTypes: true,
        status: true,
        allowlistedHost: true,
        createdAt: true,
      },
    });
    return { webhook, productionDeliveryEnabled: webhook.status === "active" };
  });
}
