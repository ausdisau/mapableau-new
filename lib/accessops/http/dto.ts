import type {
  AccessCommunityReport,
  AccessFeatureObservation,
  AccessJourneyPlan,
  AccessOpsIncident,
  AccessReliabilityMeasurement,
  AccessSensorDevice,
  AccessSensorObservation,
  AccessStatusEvent,
  AccessWorkOrder,
  Prisma,
} from "@prisma/client";

import type { AccessAssetDto, JsonObject } from "../types";
import { isRestrictedClassification } from "../types";

export interface AccessAssetResponseDto
  extends Omit<AccessAssetDto, "geometryReference"> {
  geometryReference: string | null;
}

function jsonObject(value: Prisma.JsonValue): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return { value };
}

function jsonArray(value: Prisma.JsonValue): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function toAccessAssetResponseDto(
  asset: AccessAssetDto,
): AccessAssetResponseDto {
  const restricted = isRestrictedClassification(asset.securityClassification);
  return {
    ...asset,
    geometryReference: restricted ? null : asset.geometryReference,
  };
}

export function toFeatureObservationDto(observation: AccessFeatureObservation) {
  return {
    id: observation.id,
    assetId: observation.assetId,
    featureType: observation.featureType,
    observedValue: jsonObject(observation.observedValue),
    unit: observation.unit,
    evidenceLevel: observation.evidenceLevel,
    sourceType: observation.sourceType,
    observationMethod: observation.observationMethod,
    observedAt: observation.observedAt,
    validUntil: observation.validUntil,
    confidence: observation.confidence,
    verificationStatus: observation.verificationStatus,
    disputeStatus: observation.disputeStatus,
    safeNotes: observation.safeNotes,
    isInferred: observation.isInferred,
  };
}

export function toStatusEventDto(event: AccessStatusEvent) {
  return {
    id: event.id,
    assetId: event.assetId,
    state: event.state,
    previousState: event.previousState,
    sourceType: event.sourceType,
    evidenceLevel: event.evidenceLevel,
    reasonCode: event.reasonCode,
    safeDescription: event.safeDescription,
    observedAt: event.observedAt,
    effectiveFrom: event.effectiveFrom,
    expectedUntil: event.expectedUntil,
    actualUntil: event.actualUntil,
    confidence: event.confidence,
    freshnessWindowSeconds: event.freshnessWindowSeconds,
    correlationId: event.correlationId,
    verificationStatus: event.verificationStatus,
  };
}

export function toIncidentDto(incident: AccessOpsIncident) {
  return {
    id: incident.id,
    assetId: incident.assetId,
    category: incident.category,
    state: incident.state,
    title: incident.title,
    safeDescription: incident.safeDescription,
    evidenceLevel: incident.evidenceLevel,
    sourceType: incident.sourceType,
    ownerNotifiedAt: incident.ownerNotifiedAt,
    operatorNotifiedAt: incident.operatorNotifiedAt,
    restorationEvidenceRef: incident.restorationEvidenceRef,
    recurringFlag: incident.recurringFlag,
    systemicReviewRequired: incident.systemicReviewRequired,
    reportedAt: incident.reportedAt,
    acknowledgedAt: incident.acknowledgedAt,
    restoredAt: incident.restoredAt,
    closedAt: incident.closedAt,
  };
}

export function toWorkOrderDto(workOrder: AccessWorkOrder) {
  return {
    id: workOrder.id,
    assetId: workOrder.assetId,
    incidentId: workOrder.incidentId,
    ownerEntityId: workOrder.ownerEntityId,
    operatorEntityId: workOrder.operatorEntityId,
    maintainerEntityId: workOrder.maintainerEntityId,
    workType: workOrder.workType,
    priority: workOrder.priority,
    title: workOrder.title,
    safeDescription: workOrder.safeDescription,
    requestedAt: workOrder.requestedAt,
    acknowledgedAt: workOrder.acknowledgedAt,
    scheduledAt: workOrder.scheduledAt,
    startedAt: workOrder.startedAt,
    completedAt: workOrder.completedAt,
    verificationRequired: workOrder.verificationRequired,
    verifiedAt: workOrder.verifiedAt,
    verifiedById: workOrder.verifiedById,
    status: workOrder.status,
  };
}

export function toSensorDto(sensor: AccessSensorDevice) {
  return {
    id: sensor.id,
    assetId: sensor.assetId,
    tenantId: sensor.tenantId,
    deviceIdentifier: sensor.deviceIdentifier,
    deviceType: sensor.deviceType,
    manufacturer: sensor.manufacturer,
    model: sensor.model,
    firmwareVersion: sensor.firmwareVersion,
    protocol: sensor.protocol,
    observationTypes: jsonArray(sensor.observationTypes),
    calibrationStatus: sensor.calibrationStatus,
    healthStatus: sensor.healthStatus,
    trustStatus: sensor.trustStatus,
    status: sensor.status,
    productionActivated: sensor.productionActivated,
  };
}

export function toSensorObservationDto(observation: AccessSensorObservation) {
  return {
    id: observation.id,
    deviceId: observation.deviceId,
    observationType: observation.observationType,
    resultValue: jsonObject(observation.resultValue),
    unit: observation.unit,
    phenomenonTime: observation.phenomenonTime,
    resultTime: observation.resultTime,
    integrityOk: observation.integrityOk,
  };
}

export function toReliabilityMeasurementDto(
  measurement: AccessReliabilityMeasurement,
) {
  return {
    id: measurement.id,
    assetId: measurement.assetId,
    windowStart: measurement.windowStart,
    windowEnd: measurement.windowEnd,
    expectedAvailableMinutes: measurement.expectedAvailableMinutes,
    verifiedAvailableMinutes: measurement.verifiedAvailableMinutes,
    degradedMinutes: measurement.degradedMinutes,
    unavailableMinutes: measurement.unavailableMinutes,
    unknownMinutes: measurement.unknownMinutes,
    scheduledMaintenanceMinutes: measurement.scheduledMaintenanceMinutes,
    unplannedOutageCount: measurement.unplannedOutageCount,
    meanRestoreMinutes: measurement.meanRestoreMinutes,
    longestOutageMinutes: measurement.longestOutageMinutes,
    statusCoveragePercent: measurement.statusCoveragePercent,
    evidenceCompleteness: measurement.evidenceCompleteness,
    calculationVersion: measurement.calculationVersion,
  };
}

export function toJourneyPlanDto(plan: AccessJourneyPlan) {
  return {
    id: plan.id,
    requestId: plan.requestId,
    tenantId: plan.tenantId,
    origin: jsonObject(plan.origin),
    destination: jsonObject(plan.destination),
    departureWindow: jsonObject(plan.departureWindow),
    routeOptions: jsonArray(plan.routeOptions),
    selectedRouteId: plan.selectedRouteId,
    status: plan.status,
    generatedAt: plan.generatedAt,
    expiresAt: plan.expiresAt,
  };
}

export function toCommunityReportDto(report: AccessCommunityReport) {
  return {
    id: report.id,
    assetId: report.assetId,
    kind: report.kind,
    status: report.status,
    safeNarrative: report.safeNarrative,
    evidenceLevel: report.evidenceLevel,
    wantsUpdates: report.wantsUpdates,
    provisionalOutage: report.provisionalOutage,
    moderatedAt: report.moderatedAt,
    withdrawnAt: report.withdrawnAt,
    createdAt: report.createdAt,
  };
}
