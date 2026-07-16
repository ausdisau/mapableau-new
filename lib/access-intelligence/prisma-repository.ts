/**
 * Prisma-backed Access Intelligence repository.
 * Persists passports, requirements, visit plans, verification requests,
 * barrier reports, and claims. Places/graphs fall back to demo fixtures
 * until AiAccessPlace graphs are fully seeded.
 */

import { Prisma } from "@prisma/client";

import { recordAuditEvent } from "@/lib/access-intelligence/audit";
import {
  createDemoPassports,
  DEMO_USER_ID,
  findDemoDestinationNode,
  findDemoEntranceNodes,
  getDemoGraph,
  DEMO_GRAPHS,
  DEMO_INCIDENTS,
} from "@/lib/access-intelligence/demo-data";
import { AccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import { ACCESS_ONTOLOGY } from "@/lib/access-intelligence/ontology";
import {
  ensureCanonicalAccessPlaceBinding,
  placeFromAccessPlace,
} from "@/lib/access-intelligence/place-binding";
import type {
  AccessIntelligenceRepository,
  BarrierReport,
  PassportShareRecord,
  VerificationRequest,
} from "@/lib/access-intelligence/repositories";
import type {
  AccessFeature,
  AccessPassport,
  AccessRequirement,
  LiveIncident,
  Place,
  VisitPlan,
} from "@/lib/access-intelligence/schemas";
import type { AccessGraph, PlaceSearchResult } from "@/lib/access-intelligence/types";
import { prisma } from "@/lib/prisma";

type PassportRow = {
  id: string;
  userId: string;
  name: string;
  communicationPreferences: Prisma.JsonValue;
  mobilityAids: Prisma.JsonValue;
  sharingDefaults: Prisma.JsonValue;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  requirements: Array<{
    id: string;
    featureType: string;
    importance: string;
    operator: string;
    value: Prisma.JsonValue;
    unit: string | null;
    notes: string | null;
    shareWithVenue: boolean;
    sortOrder: number;
  }>;
};

function asStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function mapRequirement(row: PassportRow["requirements"][number]): AccessRequirement {
  return {
    id: row.id,
    featureType: row.featureType as AccessRequirement["featureType"],
    importance: row.importance as AccessRequirement["importance"],
    operator: row.operator as AccessRequirement["operator"],
    value: row.value as AccessRequirement["value"],
    unit: row.unit ?? undefined,
    notes: row.notes ?? undefined,
    shareWithVenue: row.shareWithVenue,
  };
}

function mapPassport(row: PassportRow): AccessPassport {
  const sharing =
    row.sharingDefaults && typeof row.sharingDefaults === "object" && !Array.isArray(row.sharingDefaults)
      ? (row.sharingDefaults as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    requirements: [...row.requirements]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(mapRequirement),
    communicationPreferences: asStringArray(row.communicationPreferences) as AccessPassport["communicationPreferences"],
    mobilityAids: asStringArray(row.mobilityAids) as AccessPassport["mobilityAids"],
    sharingDefaults: {
      shareRequiredWithVenue: Boolean(sharing.shareRequiredWithVenue),
      sharePreferredWithVenue: Boolean(sharing.sharePreferredWithVenue),
      shareHelpfulWithVenue: Boolean(sharing.shareHelpfulWithVenue),
      purpose: typeof sharing.purpose === "string" ? sharing.purpose : undefined,
      durationHours:
        typeof sharing.durationHours === "number" ? sharing.durationHours : undefined,
    },
    isDefault: row.isDefault,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function ensurePassportsSeeded(userId: string): Promise<void> {
  const count = await prisma.aiAccessPassport.count({ where: { userId } });
  if (count > 0) return;
  const demos = createDemoPassports(userId.length > 0 ? userId : DEMO_USER_ID);
  for (const passport of demos) {
    await prisma.aiAccessPassport.create({
      data: {
        id: passport.id,
        userId: passport.userId,
        name: passport.name,
        communicationPreferences: passport.communicationPreferences,
        mobilityAids: passport.mobilityAids,
        sharingDefaults: passport.sharingDefaults,
        isDefault: passport.isDefault,
        createdAt: new Date(passport.createdAt),
        updatedAt: new Date(passport.updatedAt),
        requirements: {
          create: passport.requirements.map((r, i) => ({
            id: r.id,
            featureType: r.featureType,
            importance: r.importance,
            operator: r.operator,
            value: r.value as Prisma.InputJsonValue,
            unit: r.unit,
            notes: r.notes,
            shareWithVenue: r.shareWithVenue,
            sortOrder: i,
          })),
        },
      },
    });
  }
}

async function ensurePlaceStub(place: Place): Promise<{ accessPlaceId: string }> {
  if (accessIntelligenceFlags.canonicalPlaceBinding) {
    const bound = await ensureCanonicalAccessPlaceBinding(place);
    return { accessPlaceId: bound.accessPlaceId };
  }
  await prisma.aiAccessPlace.upsert({
    where: { id: place.id },
    create: {
      id: place.id,
      name: place.name,
      address: place.address,
      category: place.category,
      lat: place.coordinates?.lat,
      lng: place.coordinates?.lng,
      operator: place.operator,
      openingHours: place.openingHours,
      baselineScore: place.baselineScore ?? undefined,
      accreditationTier: place.accreditationTier ?? undefined,
      lastVerifiedAt: place.lastVerifiedAt ? new Date(place.lastVerifiedAt) : undefined,
    },
    update: {
      name: place.name,
      address: place.address,
      updatedAt: new Date(),
    },
  });
  return { accessPlaceId: place.id };
}

function mapFeatureRow(row: {
  id: string;
  placeId: string;
  elementId: string;
  featureType: string;
  value: Prisma.JsonValue;
  unit: string | null;
  sourceType: string;
  observedAt: Date;
  validUntil: Date | null;
  evidenceIds: Prisma.JsonValue;
  confidence: number;
  disputed: boolean;
  notes: string | null;
}): AccessFeature {
  return {
    id: row.id,
    placeId: row.placeId,
    elementId: row.elementId,
    featureType: row.featureType as AccessFeature["featureType"],
    value: row.value as AccessFeature["value"],
    unit: row.unit ?? undefined,
    sourceType: row.sourceType as AccessFeature["sourceType"],
    observedAt: row.observedAt.toISOString(),
    validUntil: row.validUntil?.toISOString(),
    evidenceIds: asStringArray(row.evidenceIds),
    confidence: row.confidence,
    disputed: row.disputed,
    notes: row.notes ?? undefined,
  };
}

export class PrismaAccessIntelligenceRepository implements AccessIntelligenceRepository {
  async listPassports(userId: string): Promise<AccessPassport[]> {
    await ensurePassportsSeeded(userId);
    const rows = await prisma.aiAccessPassport.findMany({
      where: { userId },
      include: { requirements: true },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(mapPassport);
  }

  async getPassport(userId: string, passportId: string): Promise<AccessPassport> {
    await ensurePassportsSeeded(userId);
    const row = await prisma.aiAccessPassport.findFirst({
      where: { id: passportId, userId },
      include: { requirements: true },
    });
    if (!row) {
      throw new AccessIntelligenceError(
        "PASSPORT_NOT_FOUND",
        "Access Passport was not found.",
        "Select or create a passport from the Passports page.",
      );
    }
    return mapPassport(row);
  }

  async savePassport(passport: AccessPassport): Promise<AccessPassport> {
    const profile = await prisma.accessibilityProfile.findUnique({
      where: { userId: passport.userId },
      select: { id: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.aiAccessPassport.upsert({
        where: { id: passport.id },
        create: {
          id: passport.id,
          userId: passport.userId,
          name: passport.name,
          communicationPreferences: passport.communicationPreferences,
          mobilityAids: passport.mobilityAids,
          sharingDefaults: passport.sharingDefaults,
          isDefault: passport.isDefault,
          accessibilityProfileId: profile?.id ?? null,
          createdAt: new Date(passport.createdAt),
          updatedAt: new Date(passport.updatedAt),
        },
        update: {
          name: passport.name,
          communicationPreferences: passport.communicationPreferences,
          mobilityAids: passport.mobilityAids,
          sharingDefaults: passport.sharingDefaults,
          isDefault: passport.isDefault,
          accessibilityProfileId: profile?.id ?? null,
          updatedAt: new Date(passport.updatedAt),
        },
      });
      await tx.aiAccessRequirement.deleteMany({ where: { passportId: passport.id } });
      if (passport.requirements.length) {
        await tx.aiAccessRequirement.createMany({
          data: passport.requirements.map((r, i) => ({
            id: r.id,
            passportId: passport.id,
            featureType: r.featureType,
            importance: r.importance,
            operator: r.operator,
            value: r.value as Prisma.InputJsonValue,
            unit: r.unit,
            notes: r.notes,
            shareWithVenue: r.shareWithVenue,
            sortOrder: i,
          })),
        });
      }
      if (passport.isDefault && profile) {
        await tx.accessibilityProfile.update({
          where: { id: profile.id },
          data: { defaultPassportId: passport.id },
        });
      }
    });

    recordAuditEvent({
      actorUserId: passport.userId,
      action: "savePassport",
      purpose: "passport_persistence",
      outcome: "approved",
      entityType: "AiAccessPassport",
      entityId: passport.id,
      metadata: {
        accessibilityProfileId: profile?.id ?? null,
        isDefault: passport.isDefault,
      },
    });

    return this.getPassport(passport.userId, passport.id);
  }

  async deletePassport(userId: string, passportId: string): Promise<void> {
    const existing = await prisma.aiAccessPassport.findFirst({
      where: { id: passportId, userId },
    });
    if (!existing) {
      throw new AccessIntelligenceError(
        "PASSPORT_NOT_FOUND",
        "Access Passport was not found.",
        "Refresh the Passports list and try again.",
      );
    }
    await prisma.aiAccessPassport.delete({ where: { id: passportId } });
  }

  async searchPlaces(query: string): Promise<PlaceSearchResult[]> {
    const q = query.trim().toLowerCase();
    return DEMO_GRAPHS.filter(
      (g) =>
        !q ||
        g.place.name.toLowerCase().includes(q) ||
        g.place.address.toLowerCase().includes(q),
    ).map((g) => ({
      place: g.place,
      matchReason: "demo_seed",
    }));
  }

  async getPlace(placeId: string): Promise<Place> {
    const graph = getDemoGraph(placeId);
    if (graph) return structuredClone(graph.place);

    if (accessIntelligenceFlags.canonicalPlaceBinding) {
      const accessPlace = await prisma.accessPlace.findUnique({
        where: { id: placeId },
        include: { location: true },
      });
      if (accessPlace) {
        return placeFromAccessPlace({
          id: accessPlace.id,
          name: accessPlace.name,
          category: accessPlace.category,
          addressText: accessPlace.addressText,
          suburb: accessPlace.suburb,
          stateOrRegion: accessPlace.stateOrRegion,
          location: accessPlace.location,
        });
      }

      const byCanonical = await prisma.aiAccessPlace.findFirst({
        where: { canonicalAccessPlaceId: placeId },
      });
      if (byCanonical) {
        return {
          id: byCanonical.canonicalAccessPlaceId ?? byCanonical.id,
          name: byCanonical.name,
          address: byCanonical.address,
          category: byCanonical.category,
          coordinates:
            byCanonical.lat != null && byCanonical.lng != null
              ? { lat: byCanonical.lat, lng: byCanonical.lng }
              : undefined,
          operator: byCanonical.operator ?? undefined,
          openingHours: byCanonical.openingHours ?? undefined,
          baselineScore: byCanonical.baselineScore ?? null,
          accreditationTier: byCanonical.accreditationTier ?? null,
          lastVerifiedAt: byCanonical.lastVerifiedAt?.toISOString() ?? null,
        };
      }
    }

    const row = await prisma.aiAccessPlace.findUnique({ where: { id: placeId } });
    if (!row) {
      throw new AccessIntelligenceError(
        "PLACE_NOT_FOUND",
        "Place was not found.",
        "Search for a seeded demonstration place or use a canonical AccessPlace id.",
      );
    }
    return {
      id: row.canonicalAccessPlaceId ?? row.id,
      name: row.name,
      address: row.address,
      category: row.category,
      coordinates:
        row.lat != null && row.lng != null ? { lat: row.lat, lng: row.lng } : undefined,
      operator: row.operator ?? undefined,
      openingHours: row.openingHours ?? undefined,
      baselineScore: row.baselineScore ?? null,
      accreditationTier: row.accreditationTier ?? null,
      lastVerifiedAt: row.lastVerifiedAt?.toISOString() ?? null,
    };
  }

  async readAccessGraph(placeId: string): Promise<AccessGraph> {
    const demo = getDemoGraph(placeId);
    if (!demo) {
      throw new AccessIntelligenceError(
        "PLACE_NOT_FOUND",
        "Access graph was not found.",
        "Use a seeded demonstration place until the Living Twin graph is imported.",
      );
    }
    const graph = structuredClone(demo);
    const persistedClaims = await prisma.aiAccessFeature.findMany({
      where: { placeId },
      orderBy: { observedAt: "desc" },
    });
    if (persistedClaims.length) {
      const byId = new Map(graph.features.map((f) => [f.id, f]));
      for (const claim of persistedClaims.map(mapFeatureRow)) {
        byId.set(claim.id, claim);
      }
      graph.features = [...byId.values()];
    }
    return graph;
  }

  async getLiveIncidents(placeId: string): Promise<LiveIncident[]> {
    const fromDb = await prisma.aiLiveIncident.findMany({
      where: { placeId },
      orderBy: { reportedAt: "desc" },
    });
    if (fromDb.length) {
      return fromDb.map((i) => ({
        id: i.id,
        placeId: i.placeId,
        elementId: i.elementId ?? undefined,
        type: i.type as LiveIncident["type"],
        severity: i.severity as LiveIncident["severity"],
        description: i.description,
        sourceType: i.sourceType as LiveIncident["sourceType"],
        reportedAt: i.reportedAt.toISOString(),
        confirmedAt: i.confirmedAt?.toISOString(),
        expiresAt: i.expiresAt?.toISOString(),
        status: i.status as LiveIncident["status"],
        affectedEdgeIds: asStringArray(i.affectedEdgeIds),
      }));
    }
    return DEMO_INCIDENTS.filter((i) => i.placeId === placeId).map((i) =>
      structuredClone(i),
    );
  }

  async findDestinationNodeId(placeId: string, destination: string): Promise<string> {
    const node = findDemoDestinationNode(placeId, destination);
    if (!node) {
      throw new AccessIntelligenceError(
        "DESTINATION_NOT_FOUND",
        `Destination "${destination}" was not found.`,
        "Try a room label such as Interview Room 3.12.",
      );
    }
    return node.id;
  }

  async findPreferredEntranceNodeId(
    placeId: string,
    options?: { preferStepFree?: boolean },
  ): Promise<string> {
    const entrances = findDemoEntranceNodes(placeId);
    if (!entrances.length) {
      throw new AccessIntelligenceError(
        "NO_ELIGIBLE_ROUTE",
        "No eligible entrance found.",
        "Check entrance evidence or temporary requirements.",
      );
    }
    if (options?.preferStepFree) {
      const graph = getDemoGraph(placeId);
      const stepFree = entrances.find((n) => {
        const features = graph?.features.filter(
          (f) => f.elementId === n.elementId && f.featureType === "step_free",
        );
        return features?.some((f) => f.value === true);
      });
      if (stepFree) return stepFree.id;
    }
    return entrances[0]!.id;
  }

  async saveVisitPlan(plan: VisitPlan): Promise<VisitPlan> {
    const place = await this.getPlace(plan.placeId);
    // Bind staging twin id (plan.placeId / demo id) to canonical AccessPlace.
    const stagingPlace: Place = { ...place, id: plan.placeId };
    const { accessPlaceId } = await ensurePlaceStub(stagingPlace);

    await prisma.aiVisitPlan.upsert({
      where: { id: plan.id },
      create: {
        id: plan.id,
        userId: plan.userId,
        placeId: plan.placeId,
        accessPlaceId,
        destination: plan.destination,
        visitAt: plan.visitAt ? new Date(plan.visitAt) : null,
        accessDecision: plan.accessDecision as unknown as Prisma.InputJsonValue,
        route: (plan.route ?? null) as unknown as Prisma.InputJsonValue,
        arrivalInstructions: plan.arrivalInstructions,
        contingencyInstructions: plan.contingencyInstructions,
        evidenceSummary: plan.evidenceSummary,
        lastCheckedAt: new Date(plan.lastCheckedAt),
      },
      update: {
        accessPlaceId,
        destination: plan.destination,
        visitAt: plan.visitAt ? new Date(plan.visitAt) : null,
        accessDecision: plan.accessDecision as unknown as Prisma.InputJsonValue,
        route: (plan.route ?? null) as unknown as Prisma.InputJsonValue,
        arrivalInstructions: plan.arrivalInstructions,
        contingencyInstructions: plan.contingencyInstructions,
        evidenceSummary: plan.evidenceSummary,
        lastCheckedAt: new Date(plan.lastCheckedAt),
      },
    });

    recordAuditEvent({
      actorUserId: plan.userId,
      action: "saveVisitPlan",
      purpose: "visit_plan_persistence",
      outcome: "approved",
      entityType: "AiVisitPlan",
      entityId: plan.id,
      metadata: {
        placeId: plan.placeId,
        accessPlaceId,
      },
    });

    return {
      ...structuredClone(plan),
      placeId: accessPlaceId,
    };
  }

  async listVisitPlans(userId: string): Promise<VisitPlan[]> {
    const rows = await prisma.aiVisitPlan.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      placeId: row.accessPlaceId ?? row.placeId,
      destination: row.destination,
      visitAt: row.visitAt?.toISOString(),
      accessDecision: row.accessDecision as VisitPlan["accessDecision"],
      route: row.route as VisitPlan["route"],
      arrivalInstructions: asStringArray(row.arrivalInstructions),
      contingencyInstructions: asStringArray(row.contingencyInstructions),
      evidenceSummary: asStringArray(row.evidenceSummary),
      lastCheckedAt: row.lastCheckedAt.toISOString(),
    }));
  }

  async getVisitPlan(userId: string, planId: string): Promise<VisitPlan> {
    const row = await prisma.aiVisitPlan.findFirst({
      where: { id: planId, userId },
    });
    if (!row) {
      throw new AccessIntelligenceError(
        "PLACE_NOT_FOUND",
        "Visit plan was not found.",
        "Return to Visit plans and select a saved plan.",
      );
    }
    return {
      id: row.id,
      userId: row.userId,
      placeId: row.accessPlaceId ?? row.placeId,
      destination: row.destination,
      visitAt: row.visitAt?.toISOString(),
      accessDecision: row.accessDecision as VisitPlan["accessDecision"],
      route: row.route as VisitPlan["route"],
      arrivalInstructions: asStringArray(row.arrivalInstructions),
      contingencyInstructions: asStringArray(row.contingencyInstructions),
      evidenceSummary: asStringArray(row.evidenceSummary),
      lastCheckedAt: row.lastCheckedAt.toISOString(),
    };
  }

  async createVerificationRequest(
    request: Omit<VerificationRequest, "id" | "createdAt" | "status">,
  ): Promise<VerificationRequest> {
    const place = await this.getPlace(request.placeId);
    await ensurePlaceStub(place);
    const row = await prisma.aiVerificationRequest.create({
      data: {
        userId: request.userId,
        placeId: request.placeId,
        questions: request.questions,
        recipient: request.recipient,
        purpose: request.purpose,
        status: "sent",
      },
    });
    recordAuditEvent({
      actorUserId: request.userId,
      action: "request_venue_verification",
      purpose: request.purpose,
      recipient: request.recipient,
      outcome: "executed",
      metadata: { placeId: request.placeId, requestId: row.id },
    });
    return {
      id: row.id,
      userId: row.userId,
      placeId: row.placeId,
      questions: asStringArray(row.questions),
      recipient: row.recipient,
      purpose: row.purpose,
      status: row.status as VerificationRequest["status"],
      createdAt: row.createdAt.toISOString(),
    };
  }

  async createBarrierReport(
    report: Omit<BarrierReport, "id" | "createdAt" | "status">,
  ): Promise<BarrierReport> {
    const place = await this.getPlace(report.placeId);
    await ensurePlaceStub(place);
    const row = await prisma.aiBarrierReport.create({
      data: {
        userId: report.userId,
        placeId: report.placeId,
        elementId: report.elementId,
        description: report.description,
        status: "published",
      },
    });
    recordAuditEvent({
      actorUserId: report.userId,
      action: "submit_barrier_report",
      purpose: "community_barrier",
      recipient: report.placeId,
      outcome: "executed",
      metadata: { reportId: row.id },
    });
    return {
      id: row.id,
      userId: row.userId,
      placeId: row.placeId,
      elementId: row.elementId ?? undefined,
      description: row.description,
      status: row.status as BarrierReport["status"],
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listBarrierReports(placeId?: string): Promise<BarrierReport[]> {
    const rows = await prisma.aiBarrierReport.findMany({
      where: placeId ? { placeId } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      placeId: row.placeId,
      elementId: row.elementId ?? undefined,
      description: row.description,
      status: row.status as BarrierReport["status"],
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async sharePassport(
    share: Omit<PassportShareRecord, "id" | "createdAt">,
  ): Promise<PassportShareRecord> {
    await this.getPassport(share.userId, share.passportId);
    const full: PassportShareRecord = {
      ...share,
      id: `share-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await prisma.aiAccessAuditEvent.create({
      data: {
        action: "share_access_passport",
        actorUserId: share.userId,
        purpose: share.purpose,
        fieldsShared: share.fieldsShared,
        recipient: share.recipient,
        outcome: "executed",
        metadata: {
          passportId: share.passportId,
          durationHours: share.durationHours,
          shareId: full.id,
        },
      },
    });
    recordAuditEvent({
      action: "share_access_passport",
      actorUserId: share.userId,
      purpose: share.purpose,
      fieldsShared: share.fieldsShared,
      recipient: share.recipient,
      outcome: "executed",
      metadata: {
        passportId: share.passportId,
        durationHours: share.durationHours,
      },
    });
    return full;
  }

  async getVenueDashboard(placeId: string) {
    const graph = await this.readAccessGraph(placeId);
    const activeIncidents = await this.getLiveIncidents(placeId);
    const presentTypes = new Set(graph.features.map((f) => f.featureType));
    const unknownFeatureTypes = Object.keys(ACCESS_ONTOLOGY).filter(
      (k) => ACCESS_ONTOLOGY[k]!.routeRelevant && !presentTypes.has(k as never),
    );
    const disputedFeatures = graph.features.filter((f) => f.disputed);
    const evidenceGaps = graph.features
      .filter((f) => f.sourceType === "venue_attestation" || f.sourceType === "community_report")
      .map(
        (f) =>
          `${f.featureType} relies on ${f.sourceType.replaceAll("_", " ")} (${new Date(f.observedAt).toLocaleDateString()})`,
      );
    return {
      place: graph.place,
      unknownFeatureTypes,
      activeIncidents,
      disputedFeatures,
      evidenceGaps,
      remediationHints: [
        ...activeIncidents.map((i) => ({
          title: `Resolve ${i.type.replaceAll("_", " ")}`,
          reason: i.description,
        })),
        ...unknownFeatureTypes.slice(0, 5).map((t) => ({
          title: `Collect evidence for ${t.replaceAll("_", " ")}`,
          reason: "Route-relevant feature has no recorded claim.",
        })),
      ],
    };
  }

  /** Persist a venue attestation claim — never upgrades to assessor_verified. */
  async upsertVenueAttestationClaim(input: {
    placeId: string;
    elementId: string;
    featureType: string;
    value: AccessFeature["value"];
    notes?: string;
  }): Promise<AccessFeature> {
    const place = await this.getPlace(input.placeId);
    await ensurePlaceStub(place);
    await prisma.aiBuildingElement.upsert({
      where: { id: input.elementId },
      create: {
        id: input.elementId,
        placeId: input.placeId,
        type: "room",
        name: input.elementId,
      },
      update: {},
    });
    const id = `claim-attest-${input.placeId}-${input.featureType}-${Date.now()}`;
    const row = await prisma.aiAccessFeature.create({
      data: {
        id,
        placeId: input.placeId,
        elementId: input.elementId,
        featureType: input.featureType,
        value: input.value as Prisma.InputJsonValue,
        sourceType: "venue_attestation",
        observedAt: new Date(),
        evidenceIds: [],
        confidence: 0.75,
        disputed: false,
        notes: input.notes ?? "Venue attestation — not assessor verification.",
      },
    });
    return mapFeatureRow(row);
  }
}

export function isPrismaAccessIntelligenceEnabled(): boolean {
  return process.env.ACCESS_INTELLIGENCE_USE_PRISMA === "true";
}
