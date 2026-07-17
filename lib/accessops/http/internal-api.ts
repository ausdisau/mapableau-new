import type { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  createAccessAsset,
  getAccessAsset,
  publishAccessAsset,
  retireAccessAsset,
} from "@/lib/accessops/assets/asset-service";
import { submitCommunityReport } from "@/lib/accessops/community/report-service";
import { appendFeatureObservation } from "@/lib/accessops/features/observation-service";
import { openAccessIncident, transitionAccessIncident } from "@/lib/accessops/incidents/access-incident-service";
import { createJourneyPlan } from "@/lib/accessops/journeys/journey-planner";
import { createWorkOrder, transitionWorkOrder } from "@/lib/accessops/maintenance/work-order-service";
import { recordReliabilityMeasurement } from "@/lib/accessops/reliability/reliability-service";
import { registerSensorDevice, suspendCompromisedSensor } from "@/lib/accessops/sensors/device-registry";
import { recordSensorObservation } from "@/lib/accessops/sensors/observations";
import { appendStatusEvent } from "@/lib/accessops/status/status-event-service";
import { listStatusHistory } from "@/lib/accessops/status/status-history";
import { projectOperationalStatus } from "@/lib/accessops/status/status-projection";
import { mapAccessAssetDto } from "@/lib/accessops/types";
import { asJsonArray } from "@/lib/prisma-json";
import { prisma } from "@/lib/prisma";

import {
  toAccessAssetResponseDto,
  toCommunityReportDto,
  toFeatureObservationDto,
  toIncidentDto,
  toJourneyPlanDto,
  toReliabilityMeasurementDto,
  toSensorDto,
  toSensorObservationDto,
  toStatusEventDto,
  toWorkOrderDto,
} from "./dto";
import {
  accessOpsError,
  accessOpsJson,
  accessOpsSafe,
  hasAccessOpsPermission,
  parseJsonBody,
  readIdempotencyKey,
  requireAccessOpsPermission,
  requireAccessOpsSession,
} from "./route-guards";

export type AssetParams = { params: Promise<{ assetId: string }> };
export type IncidentParams = { params: Promise<{ incidentId: string }> };
export type IdParams = { params: Promise<{ id: string }> };

const limitSchema = z.coerce.number().int().min(1).max(200).default(50);
const jsonObjectSchema = z.record(z.string(), z.unknown());

const assetTypeSchema = z.enum([
  "venue",
  "building",
  "entrance",
  "floor",
  "room",
  "corridor",
  "path",
  "footpath",
  "crossing",
  "kerb_ramp",
  "drop_off_zone",
  "parking_space",
  "transit_stop",
  "station",
  "platform",
  "lift",
  "escalator",
  "ramp",
  "stair",
  "door",
  "gate",
  "toilet",
  "changing_place",
  "service_counter",
  "quiet_space",
  "hearing_loop",
  "tactile_feature",
  "wayfinding_sign",
  "checkpoint",
  "vehicle",
  "route_segment",
  "equipment",
  "sensor",
  "other",
]);
const publicVisibilitySchema = z.enum([
  "public",
  "authenticated",
  "restricted",
  "staff_only",
  "never_public",
]);
const securityClassificationSchema = z.enum([
  "public",
  "internal",
  "restricted",
  "security_sensitive",
]);
const lifecycleStatusSchema = z.enum([
  "proposed",
  "mapped",
  "awaiting_owner",
  "awaiting_verification",
  "active",
  "degraded",
  "maintenance",
  "suspended",
  "retired",
  "removed",
  "archived",
]);
const featureTypeSchema = z.enum([
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
]);
const evidenceLevelSchema = z.enum([
  "self_reported",
  "community_observed",
  "operator_reported",
  "document_supported",
  "sensor_observed",
  "assessor_verified",
  "independently_verified",
  "authoritative_source",
  "disputed",
  "unknown",
]);
const observationMethodSchema = z.enum([
  "manual_measurement",
  "professional_assessment",
  "operator_declaration",
  "community_report",
  "sensor",
  "document_import",
  "structured_feed",
  "MapAble_import",
  "inferred_from_geometry",
  "unknown",
]);
const verificationStatusSchema = z.enum([
  "unverified",
  "pending_review",
  "verified",
  "rejected",
  "superseded",
]);
const operationalStateSchema = z.enum([
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
]);
const statusSourceTypeSchema = z.enum([
  "operator",
  "sensor",
  "community",
  "assessor",
  "system_projection",
  "import_feed",
  "test",
]);
const statusReasonCodeSchema = z.enum([
  "normal_operation",
  "planned_maintenance",
  "unplanned_failure",
  "vandalism",
  "weather",
  "power_failure",
  "network_failure",
  "construction",
  "staffing",
  "obstruction",
  "cleanliness",
  "safety_issue",
  "sensor_fault",
  "inspection",
  "community_report",
  "data_conflict",
  "unknown",
]);
const incidentCategorySchema = z.enum([
  "asset_failure",
  "lift_failure",
  "door_failure",
  "toilet_unavailable",
  "changing_place_unavailable",
  "kerb_obstruction",
  "parking_misuse",
  "route_obstruction",
  "construction_barrier",
  "signage_failure",
  "sensory_access_failure",
  "hearing_loop_failure",
  "information_failure",
  "staff_access_failure",
  "transit_access_failure",
  "digital_access_failure",
  "sensor_failure",
  "data_integrity",
  "other",
]);
const workTypeSchema = z.enum([
  "inspection",
  "cleaning",
  "obstruction_removal",
  "repair",
  "replacement",
  "software_update",
  "signage",
  "temporary_access_measure",
  "preventive_maintenance",
  "data_correction",
  "sensor_service",
  "other",
]);
const workPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
const communityReportKindSchema = z.enum([
  "working",
  "not_working",
  "blocked",
  "difficult_to_use",
  "information_incorrect",
  "temporary_change",
  "staff_assistance_unavailable",
  "accessible_toilet_unavailable",
  "lift_unavailable",
  "drop_off_blocked",
  "route_inaccessible",
  "sensory_condition_changed",
  "other",
]);
const sensorDeviceTypeSchema = z.enum([
  "lift_state",
  "door_state",
  "obstruction",
  "parking_occupancy",
  "drop_off_occupancy",
  "environmental",
  "equipment_health",
  "connectivity",
  "other",
]);
const fitSchema = z.enum([
  "compatible",
  "incompatible",
  "uncertain",
  "requires_confirmation",
  "insufficient_data",
]);

const createAssetSchema = z.object({
  assetType: assetTypeSchema,
  title: z.string().min(1),
  sourceSystem: z.string().min(1),
  tenantId: z.string().optional().nullable(),
  parentAssetId: z.string().optional().nullable(),
  placeId: z.string().optional().nullable(),
  venueId: z.string().optional().nullable(),
  floorPlanId: z.string().optional().nullable(),
  geometryReference: z.string().optional().nullable(),
  geometryType: z.string().optional().nullable(),
  indoorLevel: z.string().optional().nullable(),
  plainLanguageDescription: z.string().optional().nullable(),
  ownerEntityId: z.string().optional().nullable(),
  operatorEntityId: z.string().optional().nullable(),
  maintainerEntityId: z.string().optional().nullable(),
  jurisdiction: z.string().optional(),
  publicVisibility: publicVisibilitySchema.optional(),
  securityClassification: securityClassificationSchema.optional(),
  sourceReference: z.string().optional().nullable(),
  dataSourceId: z.string().optional().nullable(),
  dataLicence: z.string().optional().nullable(),
});

const patchAssetSchema = z.object({
  title: z.string().min(1).optional(),
  plainLanguageDescription: z.string().optional().nullable(),
  lifecycleStatus: lifecycleStatusSchema.optional(),
  publicVisibility: publicVisibilitySchema.optional(),
  securityClassification: securityClassificationSchema.optional(),
  ownerEntityId: z.string().optional().nullable(),
  operatorEntityId: z.string().optional().nullable(),
  maintainerEntityId: z.string().optional().nullable(),
  effectiveTo: z.coerce.date().optional().nullable(),
});

const featureObservationSchema = z.object({
  featureType: featureTypeSchema,
  observedValue: jsonObjectSchema,
  sourceType: z.string().min(1),
  observedAt: z.coerce.date().default(() => new Date()),
  unit: z.string().optional().nullable(),
  evidenceLevel: evidenceLevelSchema.optional(),
  sourceEntityId: z.string().optional().nullable(),
  sourceReference: z.string().optional().nullable(),
  observationMethod: observationMethodSchema.optional(),
  validUntil: z.coerce.date().optional().nullable(),
  confidence: z.number().min(0).max(1).optional(),
  verificationStatus: verificationStatusSchema.optional(),
  safeNotes: z.string().max(2000).optional().nullable(),
  isInferred: z.boolean().optional(),
});

const statusEventSchema = z.object({
  state: operationalStateSchema,
  sourceType: statusSourceTypeSchema,
  safeDescription: z.string().min(1).max(2000),
  observedAt: z.coerce.date().default(() => new Date()),
  effectiveFrom: z.coerce.date().optional(),
  previousState: operationalStateSchema.optional().nullable(),
  sourceEntityId: z.string().optional().nullable(),
  sourceReference: z.string().optional().nullable(),
  evidenceLevel: evidenceLevelSchema.optional(),
  reasonCode: statusReasonCodeSchema.optional(),
  expectedUntil: z.coerce.date().optional().nullable(),
  actualUntil: z.coerce.date().optional().nullable(),
  confidence: z.number().min(0).max(1).optional(),
  freshnessWindowSeconds: z.number().int().min(60).max(31_536_000).optional(),
  externalEventId: z.string().optional().nullable(),
  verificationStatus: verificationStatusSchema.optional(),
});

const incidentCreateSchema = z.object({
  assetId: z.string().min(1),
  category: incidentCategorySchema,
  title: z.string().min(1),
  safeDescription: z.string().min(1).max(2000),
  sourceType: z.string().min(1),
  evidenceLevel: evidenceLevelSchema.optional(),
  reporterOpaqueRef: z.string().optional().nullable(),
});

const evidenceRefSchema = z.object({
  evidenceRef: z.string().min(1).optional(),
});

const workOrderCreateSchema = z.object({
  assetId: z.string().min(1),
  workType: workTypeSchema,
  title: z.string().min(1),
  safeDescription: z.string().min(1).max(2000),
  incidentId: z.string().optional().nullable(),
  priority: workPrioritySchema.optional(),
  maintainerEntityId: z.string().optional().nullable(),
});

const sensorCreateSchema = z.object({
  assetId: z.string().min(1),
  deviceIdentifier: z.string().min(1),
  deviceType: sensorDeviceTypeSchema,
  protocol: z.string().min(1),
  observationTypes: z.array(z.string().min(1)).min(1),
  tenantId: z.string().optional().nullable(),
});

const sensorObservationSchema = z.object({
  observationType: z.string().min(1),
  resultValue: jsonObjectSchema,
  phenomenonTime: z.coerce.date().default(() => new Date()),
  resultTime: z.coerce.date().default(() => new Date()),
  unit: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
  integrityOk: z.boolean().optional(),
});

const routeOptionSchema = z.object({
  routeId: z.string().min(1),
  assetIds: z.array(z.string()),
  edgeIds: z.array(z.string()),
  fit: fitSchema,
  warnings: z.array(z.string()),
  requiresApproval: z.boolean(),
});

const journeyPlanSchema = z.object({
  requestId: z.string().min(1),
  origin: jsonObjectSchema,
  destination: jsonObjectSchema,
  departureWindow: jsonObjectSchema,
  routeOptions: z.array(routeOptionSchema).default([]),
  expiresAt: z.coerce.date(),
  tenantId: z.string().optional().nullable(),
  statusSnapshotId: z.string().optional(),
});

const communityReportSchema = z.object({
  assetId: z.string().min(1),
  kind: communityReportKindSchema,
  safeNarrative: z.string().min(1).max(2000),
  reporterOpaqueRef: z.string().optional().nullable(),
  evidenceRefs: z.array(z.string()).optional(),
});

const bucketSchema = z.object({
  state: operationalStateSchema,
  minutes: z.number().int().min(0),
  expected: z.boolean().optional(),
  evidencePresent: z.boolean().optional(),
  scheduled: z.boolean().optional(),
  outageKey: z.string().optional(),
});

const reliabilityCalculateSchema = z.object({
  assetId: z.string().min(1),
  windowStart: z.coerce.date(),
  windowEnd: z.coerce.date(),
  buckets: z.array(bucketSchema).min(1),
});

export async function handleAssetsGet(request: Request): Promise<Response> {
  const user = await requireAccessOpsSession();
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const parsed = z
    .object({
      assetType: assetTypeSchema.optional(),
      placeId: z.string().optional(),
      lifecycleStatus: lifecycleStatusSchema.optional(),
      limit: limitSchema,
    })
    .safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return accessOpsError("VALIDATION_ERROR", "Invalid asset query.", 400);
  }
  const where: Prisma.AccessAssetWhereInput = {
    ...(parsed.data.assetType ? { assetType: parsed.data.assetType } : {}),
    ...(parsed.data.placeId ? { placeId: parsed.data.placeId } : {}),
    ...(parsed.data.lifecycleStatus
      ? { lifecycleStatus: parsed.data.lifecycleStatus }
      : {}),
    ...(hasAccessOpsPermission(user, "accessops:read_restricted")
      ? {}
      : {
          securityClassification: "public",
          publicVisibility: { in: ["public", "authenticated"] },
        }),
  };
  return accessOpsSafe(async () => {
    const assets = await prisma.accessAsset.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: parsed.data.limit,
    });
    return {
      assets: assets.map((asset) =>
        toAccessAssetResponseDto(mapAccessAssetDto(asset)),
      ),
    };
  });
}

export async function handleAssetsPost(request: Request): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_assets");
  if (user instanceof Response) return user;
  const parsed = await parseJsonBody(request, createAssetSchema);
  if ("response" in parsed) return parsed.response;
  return accessOpsSafe(async () => ({
    asset: toAccessAssetResponseDto(await createAccessAsset(parsed.data)),
    idempotencyKey: readIdempotencyKey(request),
  }));
}

export async function handleAssetGet(
  _request: Request,
  { params }: AssetParams,
): Promise<Response> {
  const user = await requireAccessOpsSession();
  if (user instanceof Response) return user;
  const { assetId } = await params;
  return accessOpsSafe(async () => {
    const asset = await getAccessAsset(assetId, {
      includeRestricted: hasAccessOpsPermission(user, "accessops:read_restricted"),
    });
    if (!asset) return { asset: null };
    return { asset: toAccessAssetResponseDto(asset) };
  });
}

export async function handleAssetPatch(
  request: Request,
  { params }: AssetParams,
): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_assets");
  if (user instanceof Response) return user;
  const parsed = await parseJsonBody(request, patchAssetSchema);
  if ("response" in parsed) return parsed.response;
  const { assetId } = await params;
  return accessOpsSafe(async () => {
    const asset = await prisma.accessAsset.update({
      where: { id: assetId },
      data: parsed.data,
    });
    return { asset: toAccessAssetResponseDto(mapAccessAssetDto(asset)) };
  });
}

export async function handleAssetPublish(
  _request: Request,
  { params }: AssetParams,
): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:publish_graph");
  if (user instanceof Response) return user;
  const { assetId } = await params;
  return accessOpsSafe(async () => ({
    asset: toAccessAssetResponseDto(await publishAccessAsset(assetId)),
  }));
}

export async function handleAssetRetire(
  _request: Request,
  { params }: AssetParams,
): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_assets");
  if (user instanceof Response) return user;
  const { assetId } = await params;
  return accessOpsSafe(async () => ({
    asset: toAccessAssetResponseDto(await retireAccessAsset(assetId)),
  }));
}

export async function handleAssetFeatures(
  request: Request,
  { params }: AssetParams,
): Promise<Response> {
  const user = await requireAccessOpsSession();
  if (user instanceof Response) return user;
  const { assetId } = await params;
  const limit = limitSchema.parse(new URL(request.url).searchParams.get("limit") ?? 50);
  return accessOpsSafe(async () => {
    const observations = await prisma.accessFeatureObservation.findMany({
      where: { assetId },
      orderBy: { observedAt: "desc" },
      take: limit,
    });
    return { observations: observations.map(toFeatureObservationDto) };
  });
}

export async function handleAssetObservationPost(
  request: Request,
  { params }: AssetParams,
): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_assets");
  if (user instanceof Response) return user;
  const parsed = await parseJsonBody(request, featureObservationSchema);
  if ("response" in parsed) return parsed.response;
  const { assetId } = await params;
  return accessOpsSafe(async () => ({
    observation: toFeatureObservationDto(
      await appendFeatureObservation({ ...parsed.data, assetId }),
    ),
  }));
}

export async function handleAssetStatusGet(
  request: Request,
  { params }: AssetParams,
): Promise<Response> {
  const user = await requireAccessOpsSession();
  if (user instanceof Response) return user;
  const { assetId } = await params;
  const limit = limitSchema.parse(new URL(request.url).searchParams.get("limit") ?? 50);
  return accessOpsSafe(async () => {
    const events = await listStatusHistory(assetId, { limit });
    return {
      status: projectOperationalStatus(events),
      events: events.map(toStatusEventDto),
    };
  });
}

export async function handleAssetStatusPost(
  request: Request,
  { params }: AssetParams,
): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_status");
  if (user instanceof Response) return user;
  const parsed = await parseJsonBody(request, statusEventSchema);
  if ("response" in parsed) return parsed.response;
  const { assetId } = await params;
  const idempotencyKey = readIdempotencyKey(request);
  return accessOpsSafe(async () => ({
    event: toStatusEventDto(
      await appendStatusEvent({
        ...parsed.data,
        assetId,
        correlationId: idempotencyKey ?? undefined,
        externalEventId: parsed.data.externalEventId ?? idempotencyKey,
      }),
    ),
    idempotencyKey,
  }));
}

export async function handleAssetReliability(
  request: Request,
  { params }: AssetParams,
): Promise<Response> {
  const user = await requireAccessOpsSession();
  if (user instanceof Response) return user;
  const { assetId } = await params;
  const limit = limitSchema.parse(new URL(request.url).searchParams.get("limit") ?? 12);
  return accessOpsSafe(async () => {
    const measurements = await prisma.accessReliabilityMeasurement.findMany({
      where: { assetId },
      orderBy: { windowEnd: "desc" },
      take: limit,
    });
    return { measurements: measurements.map(toReliabilityMeasurementDto) };
  });
}

export async function handleActiveStatus(request: Request): Promise<Response> {
  const user = await requireAccessOpsSession();
  if (user instanceof Response) return user;
  const limit = limitSchema.parse(new URL(request.url).searchParams.get("limit") ?? 100);
  return accessOpsSafe(async () => {
    const events = await prisma.accessStatusEvent.findMany({
      orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
      take: Math.min(limit * 5, 500),
    });
    const byAsset = new Map<string, typeof events>();
    for (const event of events) {
      byAsset.set(event.assetId, [...(byAsset.get(event.assetId) ?? []), event]);
    }
    return {
      statuses: [...byAsset.entries()].slice(0, limit).map(([assetId, assetEvents]) => ({
        assetId,
        status: projectOperationalStatus(assetEvents),
      })),
    };
  });
}

export async function handleIncidentsGet(request: Request): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_incidents");
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const limit = limitSchema.parse(url.searchParams.get("limit") ?? 50);
  return accessOpsSafe(async () => {
    const incidents = await prisma.accessOpsIncident.findMany({
      where: url.searchParams.get("assetId")
        ? { assetId: url.searchParams.get("assetId") ?? undefined }
        : {},
      orderBy: { reportedAt: "desc" },
      take: limit,
    });
    return { incidents: incidents.map(toIncidentDto) };
  });
}

export async function handleIncidentsPost(request: Request): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_incidents");
  if (user instanceof Response) return user;
  const parsed = await parseJsonBody(request, incidentCreateSchema);
  if ("response" in parsed) return parsed.response;
  return accessOpsSafe(async () => ({
    incident: toIncidentDto(await openAccessIncident(parsed.data)),
  }));
}

export async function handleIncidentGet(
  _request: Request,
  { params }: IncidentParams,
): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_incidents");
  if (user instanceof Response) return user;
  const { incidentId } = await params;
  return accessOpsSafe(async () => {
    const incident = await prisma.accessOpsIncident.findUnique({
      where: { id: incidentId },
    });
    return { incident: incident ? toIncidentDto(incident) : null };
  });
}

export async function handleIncidentTransition(
  request: Request,
  params: IncidentParams,
  to: "acknowledged" | "restored" | "closed",
): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_incidents");
  if (user instanceof Response) return user;
  const parsed = await parseJsonBody(request, evidenceRefSchema);
  if ("response" in parsed) return parsed.response;
  const { incidentId } = await params.params;
  return accessOpsSafe(async () => ({
    incident: toIncidentDto(
      await transitionAccessIncident(incidentId, to, parsed.data.evidenceRef),
    ),
  }));
}

export async function handleWorkOrdersGet(request: Request): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_incidents");
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const limit = limitSchema.parse(url.searchParams.get("limit") ?? 50);
  return accessOpsSafe(async () => {
    const workOrders = await prisma.accessWorkOrder.findMany({
      where: url.searchParams.get("assetId")
        ? { assetId: url.searchParams.get("assetId") ?? undefined }
        : {},
      orderBy: { requestedAt: "desc" },
      take: limit,
    });
    return { workOrders: workOrders.map(toWorkOrderDto) };
  });
}

export async function handleWorkOrdersPost(request: Request): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_incidents");
  if (user instanceof Response) return user;
  const parsed = await parseJsonBody(request, workOrderCreateSchema);
  if ("response" in parsed) return parsed.response;
  return accessOpsSafe(async () => ({
    workOrder: toWorkOrderDto(await createWorkOrder(parsed.data)),
  }));
}

export async function handleWorkOrderComplete(
  _request: Request,
  { params }: IdParams,
): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_incidents");
  if (user instanceof Response) return user;
  const { id } = await params;
  return accessOpsSafe(async () => ({
    workOrder: toWorkOrderDto(
      await transitionWorkOrder(id, "completed_pending_verification"),
    ),
  }));
}

export async function handleWorkOrderVerify(
  _request: Request,
  { params }: IdParams,
): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_incidents");
  if (user instanceof Response) return user;
  const { id } = await params;
  return accessOpsSafe(async () => ({
    workOrder: toWorkOrderDto(await transitionWorkOrder(id, "verified", user.id)),
  }));
}

export async function handleSensorsGet(request: Request): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_sensors");
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const limit = limitSchema.parse(url.searchParams.get("limit") ?? 50);
  return accessOpsSafe(async () => {
    const sensors = await prisma.accessSensorDevice.findMany({
      where: url.searchParams.get("assetId")
        ? { assetId: url.searchParams.get("assetId") ?? undefined }
        : {},
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return { sensors: sensors.map(toSensorDto) };
  });
}

export async function handleSensorsPost(request: Request): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_sensors");
  if (user instanceof Response) return user;
  const parsed = await parseJsonBody(request, sensorCreateSchema);
  if ("response" in parsed) return parsed.response;
  return accessOpsSafe(async () => ({
    sensor: toSensorDto(await registerSensorDevice(parsed.data)),
  }));
}

export async function handleSensorObservationPost(
  request: Request,
  { params }: IdParams,
): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_sensors");
  if (user instanceof Response) return user;
  const parsed = await parseJsonBody(request, sensorObservationSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;
  return accessOpsSafe(async () => ({
    observation: toSensorObservationDto(
      await recordSensorObservation({ ...parsed.data, deviceId: id }),
    ),
    mutatesStatus: false,
  }));
}

export async function handleSensorSuspend(
  _request: Request,
  { params }: IdParams,
): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_sensors");
  if (user instanceof Response) return user;
  const { id } = await params;
  return accessOpsSafe(async () => ({
    sensor: toSensorDto(await suspendCompromisedSensor(id)),
  }));
}

export async function handleJourneyPlan(request: Request): Promise<Response> {
  const user = await requireAccessOpsSession();
  if (user instanceof Response) return user;
  const parsed = await parseJsonBody(request, journeyPlanSchema);
  if ("response" in parsed) return parsed.response;
  return accessOpsSafe(async () => ({
    journey: toJourneyPlanDto(
      await createJourneyPlan({ ...parsed.data, participantId: null }),
    ),
  }));
}

export async function handleJourneyGet(
  _request: Request,
  { params }: IdParams,
): Promise<Response> {
  const user = await requireAccessOpsSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  return accessOpsSafe(async () => {
    const journey = await prisma.accessJourneyPlan.findUnique({ where: { id } });
    return { journey: journey ? toJourneyPlanDto(journey) : null };
  });
}

export async function handleCommunityReportPost(
  request: Request,
): Promise<Response> {
  const parsed = await parseJsonBody(request, communityReportSchema);
  if ("response" in parsed) return parsed.response;
  return accessOpsSafe(async () => ({
    report: toCommunityReportDto(await submitCommunityReport(parsed.data)),
    allegationOnly: true,
  }));
}

export async function handleCommunityReportGet(
  _request: Request,
  { params }: IdParams,
): Promise<Response> {
  const user = await requireAccessOpsSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  return accessOpsSafe(async () => {
    const report = await prisma.accessCommunityReport.findUnique({
      where: { id },
      select: {
        id: true,
        assetId: true,
        kind: true,
        status: true,
        safeNarrative: true,
        evidenceLevel: true,
        provisionalOutage: true,
        createdAt: true,
      },
    });
    return { report };
  });
}

export async function handleReliabilityReports(request: Request): Promise<Response> {
  const user = await requireAccessOpsSession();
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const limit = limitSchema.parse(url.searchParams.get("limit") ?? 50);
  return accessOpsSafe(async () => {
    const measurements = await prisma.accessReliabilityMeasurement.findMany({
      where: url.searchParams.get("assetId")
        ? { assetId: url.searchParams.get("assetId") ?? undefined }
        : {},
      orderBy: { windowEnd: "desc" },
      take: limit,
    });
    return { reports: measurements.map(toReliabilityMeasurementDto) };
  });
}

export async function handleAdminReliabilityCalculate(
  request: Request,
): Promise<Response> {
  const user = await requireAccessOpsPermission("accessops:manage_status");
  if (user instanceof Response) return user;
  const parsed = await parseJsonBody(request, reliabilityCalculateSchema);
  if ("response" in parsed) return parsed.response;
  return accessOpsSafe(async () => ({
    measurement: toReliabilityMeasurementDto(
      await recordReliabilityMeasurement(parsed.data),
    ),
  }));
}

export function encodeJsonArray(values: string[]): Prisma.InputJsonValue {
  return asJsonArray(values) ?? [];
}
