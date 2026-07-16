import { prisma } from "@/lib/prisma";

import {
  buildHarbourAccessGraph,
  buildHarbourLivingTwin,
  HARBOUR_OPERATING_RULES,
  HARBOUR_PLACE_ID,
} from "../living/harbour-civic";
import type { LearningTraceEvent, VenueMutation } from "../living/schemas";
import type { LiveIncident } from "../schemas";

import type {
  LearningSessionRecord,
  LiveStatusSnapshot,
  LivingPersistence,
  MutationDraftRecord,
  VenueStaffAssignment,
  VenueStaffRole,
} from "./types";

function asJson(value: unknown) {
  return value as object;
}

/**
 * Prisma-backed Living Building persistence.
 * Requires ACCESS_INTELLIGENCE_USE_PRISMA=true and migrated ai_* tables.
 */
export class PrismaLivingPersistence implements LivingPersistence {
  readonly kind = "prisma" as const;

  async ensureTwinSeeded(placeId: string): Promise<void> {
    if (placeId !== HARBOUR_PLACE_ID) return;
    const existing = await prisma.aiAccessPlace.findUnique({
      where: { id: placeId },
    });
    if (existing) {
      const meta = await prisma.aiLivingTwinMeta.findUnique({
        where: { placeId },
      });
      if (meta) return;
    }

    const twin = buildHarbourLivingTwin();
    const graph = buildHarbourAccessGraph();

    await prisma.$transaction(async (tx) => {
      await tx.aiAccessPlace.upsert({
        where: { id: placeId },
        create: {
          id: placeId,
          name: graph.place.name,
          address: graph.place.address,
          category: graph.place.category,
          lat: graph.place.coordinates?.lat,
          lng: graph.place.coordinates?.lng,
          operator: graph.place.operator,
          openingHours: graph.place.openingHours,
          baselineScore: graph.place.baselineScore ?? undefined,
          accreditationTier: graph.place.accreditationTier,
          lastVerifiedAt: graph.place.lastVerifiedAt
            ? new Date(graph.place.lastVerifiedAt)
            : undefined,
        },
        update: {
          name: graph.place.name,
          address: graph.place.address,
          openingHours: graph.place.openingHours,
          baselineScore: graph.place.baselineScore ?? undefined,
        },
      });

      for (const el of graph.elements) {
        await tx.aiBuildingElement.upsert({
          where: { id: el.id },
          create: {
            id: el.id,
            placeId,
            type: el.type,
            name: el.name,
            level: el.level,
          },
          update: { name: el.name, type: el.type, level: el.level },
        });
      }

      for (const ev of graph.evidence) {
        await tx.aiAccessEvidence.upsert({
          where: { id: ev.id },
          create: {
            id: ev.id,
            type: ev.type,
            title: ev.title,
            description: ev.description,
            capturedAt: new Date(ev.capturedAt),
            sourceName: ev.sourceName,
            sourceType: ev.sourceType,
            uri: ev.uri,
            measurement: ev.measurement ? asJson(ev.measurement) : undefined,
            calibrationConfirmed: ev.calibrationConfirmed,
            status: ev.status,
            placeId,
          },
          update: {
            title: ev.title,
            status: ev.status,
            capturedAt: new Date(ev.capturedAt),
          },
        });
      }

      for (const f of graph.features) {
        await tx.aiAccessFeature.upsert({
          where: { id: f.id },
          create: {
            id: f.id,
            placeId,
            elementId: f.elementId,
            featureType: f.featureType,
            value: asJson(f.value),
            unit: f.unit,
            sourceType: f.sourceType,
            observedAt: new Date(f.observedAt),
            validUntil: f.validUntil ? new Date(f.validUntil) : undefined,
            evidenceIds: f.evidenceIds,
            confidence: f.confidence,
            disputed: f.disputed,
            notes: f.notes,
          },
          update: {
            value: asJson(f.value),
            confidence: f.confidence,
            disputed: f.disputed,
            notes: f.notes,
          },
        });
      }

      for (const n of graph.nodes) {
        await tx.aiRouteNode.upsert({
          where: { id: n.id },
          create: {
            id: n.id,
            placeId,
            elementId: n.elementId,
            label: n.label,
            level: n.level,
            coordinates: n.coordinates ? asJson(n.coordinates) : undefined,
            nodeType: n.nodeType,
          },
          update: { label: n.label, nodeType: n.nodeType },
        });
      }

      for (const e of graph.edges) {
        await tx.aiRouteEdge.upsert({
          where: { id: e.id },
          create: {
            id: e.id,
            placeId,
            fromNodeId: e.fromNodeId,
            toNodeId: e.toNodeId,
            distanceMetres: e.distanceMetres,
            widthMm: e.widthMm,
            gradientRatio: e.gradientRatio,
            steps: e.steps,
            temporaryBarrier: e.temporaryBarrier,
            evidenceConfidence: e.evidenceConfidence,
            liftAvailable: e.liftAvailable,
            automaticDoor: e.automaticDoor,
            surface: e.surface,
          },
          update: {
            distanceMetres: e.distanceMetres,
            temporaryBarrier: e.temporaryBarrier,
            evidenceConfidence: e.evidenceConfidence,
          },
        });
      }

      for (const rule of HARBOUR_OPERATING_RULES) {
        await tx.aiTemporalRule.upsert({
          where: { id: rule.id },
          create: {
            id: rule.id,
            placeId,
            elementId: rule.elementId,
            edgeIds: rule.edgeIds,
            ruleType: rule.ruleType,
            closesAfterHourLocal: rule.closesAfterHourLocal,
            opensAtHourLocal: rule.opensAtHourLocal,
            effectAvailable: rule.effect.available,
            effectNote: rule.effect.note,
          },
          update: {
            closesAfterHourLocal: rule.closesAfterHourLocal,
            effectNote: rule.effect.note,
            edgeIds: rule.edgeIds,
          },
        });
      }

      await tx.aiLivingTwinMeta.upsert({
        where: { placeId },
        create: {
          placeId,
          version: twin.version,
          fictionalNotice: twin.fictionalNotice,
          destinations: twin.destinations,
        },
        update: {
          version: twin.version,
          fictionalNotice: twin.fictionalNotice,
          destinations: twin.destinations,
        },
      });
    });
  }

  async loadIncidents(placeId: string): Promise<LiveIncident[]> {
    const rows = await prisma.aiLiveIncident.findMany({
      where: { placeId },
      orderBy: { reportedAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      placeId: r.placeId,
      elementId: r.elementId ?? undefined,
      type: r.type as LiveIncident["type"],
      severity: r.severity as LiveIncident["severity"],
      description: r.description,
      sourceType: r.sourceType as LiveIncident["sourceType"],
      reportedAt: r.reportedAt.toISOString(),
      confirmedAt: r.confirmedAt?.toISOString(),
      expiresAt: r.expiresAt?.toISOString(),
      status: r.status as LiveIncident["status"],
      affectedEdgeIds: (r.affectedEdgeIds as string[]) ?? [],
    }));
  }

  async saveIncident(incident: LiveIncident): Promise<LiveIncident> {
    await this.ensureTwinSeeded(incident.placeId);
    await prisma.aiLiveIncident.upsert({
      where: { id: incident.id },
      create: {
        id: incident.id,
        placeId: incident.placeId,
        elementId: incident.elementId,
        type: incident.type,
        severity: incident.severity,
        description: incident.description,
        sourceType: incident.sourceType,
        reportedAt: new Date(incident.reportedAt),
        confirmedAt: incident.confirmedAt
          ? new Date(incident.confirmedAt)
          : undefined,
        expiresAt: incident.expiresAt ? new Date(incident.expiresAt) : undefined,
        status: incident.status,
        affectedEdgeIds: incident.affectedEdgeIds,
      },
      update: {
        status: incident.status,
        description: incident.description,
        expiresAt: incident.expiresAt ? new Date(incident.expiresAt) : undefined,
        affectedEdgeIds: incident.affectedEdgeIds,
      },
    });
    return incident;
  }

  async updateIncident(
    incidentId: string,
    patch: Partial<Pick<LiveIncident, "status" | "expiresAt" | "description">>,
  ): Promise<LiveIncident> {
    const row = await prisma.aiLiveIncident.update({
      where: { id: incidentId },
      data: {
        status: patch.status,
        description: patch.description,
        expiresAt: patch.expiresAt ? new Date(patch.expiresAt) : undefined,
      },
    });
    return {
      id: row.id,
      placeId: row.placeId,
      elementId: row.elementId ?? undefined,
      type: row.type as LiveIncident["type"],
      severity: row.severity as LiveIncident["severity"],
      description: row.description,
      sourceType: row.sourceType as LiveIncident["sourceType"],
      reportedAt: row.reportedAt.toISOString(),
      confirmedAt: row.confirmedAt?.toISOString(),
      expiresAt: row.expiresAt?.toISOString(),
      status: row.status as LiveIncident["status"],
      affectedEdgeIds: (row.affectedEdgeIds as string[]) ?? [],
    };
  }

  async saveMutationDraft(input: {
    placeId: string;
    userId: string;
    mutation: VenueMutation;
  }): Promise<MutationDraftRecord> {
    const row = await prisma.aiVenueMutationDraft.create({
      data: {
        placeId: input.placeId,
        userId: input.userId,
        mutationId: input.mutation.id,
        mutation: asJson(input.mutation),
        status: "draft",
      },
    });
    return {
      id: row.id,
      placeId: row.placeId,
      userId: row.userId,
      mutationId: row.mutationId,
      mutation: row.mutation as unknown as VenueMutation,
      status: "draft",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listMutationDrafts(
    userId: string,
    placeId?: string,
  ): Promise<MutationDraftRecord[]> {
    const rows = await prisma.aiVenueMutationDraft.findMany({
      where: {
        userId,
        ...(placeId ? { placeId } : {}),
        status: "draft",
      },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      placeId: row.placeId,
      userId: row.userId,
      mutationId: row.mutationId,
      mutation: row.mutation as unknown as VenueMutation,
      status: row.status as "draft",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async saveLearningSession(
    session: LearningSessionRecord,
  ): Promise<LearningSessionRecord> {
    await prisma.aiLearningSession.upsert({
      where: { id: session.id },
      create: {
        id: session.id,
        userId: session.userId,
        scenarioId: session.scenarioId,
        stage: session.stage,
        snapshot: asJson(session.snapshot),
      },
      update: {
        stage: session.stage,
        snapshot: asJson(session.snapshot),
      },
    });
    for (const event of session.events) {
      const existing = await prisma.aiLearningTraceEvent.findFirst({
        where: {
          sessionId: session.id,
          type: event.type,
          createdAt: new Date(
            "timestamp" in event ? event.timestamp : session.updatedAt,
          ),
        },
      });
      if (!existing) {
        await prisma.aiLearningTraceEvent.create({
          data: {
            sessionId: session.id,
            type: event.type,
            payload: asJson(event),
            createdAt: new Date(
              "timestamp" in event ? event.timestamp : new Date().toISOString(),
            ),
          },
        });
      }
    }
    return (await this.getLearningSession(session.id)) ?? session;
  }

  async getLearningSession(
    sessionId: string,
  ): Promise<LearningSessionRecord | null> {
    const row = await prisma.aiLearningSession.findUnique({
      where: { id: sessionId },
      include: { events: { orderBy: { createdAt: "asc" } } },
    });
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      scenarioId: row.scenarioId,
      stage: row.stage,
      snapshot: row.snapshot as Record<string, unknown>,
      events: row.events.map((e) => e.payload as LearningTraceEvent),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async appendLearningTrace(
    sessionId: string,
    event: LearningTraceEvent,
  ): Promise<LearningSessionRecord> {
    await prisma.aiLearningTraceEvent.create({
      data: {
        sessionId,
        type: event.type,
        payload: asJson(event),
        createdAt: new Date(
          "timestamp" in event ? event.timestamp : new Date().toISOString(),
        ),
      },
    });
    const session = await this.getLearningSession(sessionId);
    if (!session) throw new Error(`Learning session ${sessionId} not found`);
    return session;
  }

  async listVenueStaff(placeId: string): Promise<VenueStaffAssignment[]> {
    const rows = await prisma.aiVenueStaffAssignment.findMany({
      where: { placeId },
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      placeId: r.placeId,
      role: r.role as VenueStaffRole,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async upsertVenueStaff(input: {
    userId: string;
    placeId: string;
    role: VenueStaffRole;
  }): Promise<VenueStaffAssignment> {
    const row = await prisma.aiVenueStaffAssignment.upsert({
      where: {
        userId_placeId: { userId: input.userId, placeId: input.placeId },
      },
      create: {
        userId: input.userId,
        placeId: input.placeId,
        role: input.role,
      },
      update: { role: input.role },
    });
    return {
      id: row.id,
      userId: row.userId,
      placeId: row.placeId,
      role: row.role as VenueStaffRole,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async isVenueStaff(userId: string, placeId: string): Promise<boolean> {
    const row = await prisma.aiVenueStaffAssignment.findUnique({
      where: { userId_placeId: { userId, placeId } },
    });
    return Boolean(row);
  }

  async saveLiveSnapshot(
    snapshot: Omit<LiveStatusSnapshot, "id"> & { id?: string },
  ): Promise<LiveStatusSnapshot> {
    const row = await prisma.aiLiveStatusSnapshot.upsert({
      where: {
        placeId_feedKey: {
          placeId: snapshot.placeId,
          feedKey: snapshot.feedKey,
        },
      },
      create: {
        ...(snapshot.id ? { id: snapshot.id } : {}),
        placeId: snapshot.placeId,
        elementId: snapshot.elementId,
        feedKey: snapshot.feedKey,
        statusPayload: asJson(snapshot.statusPayload),
        sourceType: snapshot.sourceType,
        observedAt: new Date(snapshot.observedAt),
        expiresAt: snapshot.expiresAt
          ? new Date(snapshot.expiresAt)
          : undefined,
      },
      update: {
        statusPayload: asJson(snapshot.statusPayload),
        observedAt: new Date(snapshot.observedAt),
        expiresAt: snapshot.expiresAt
          ? new Date(snapshot.expiresAt)
          : undefined,
        elementId: snapshot.elementId,
      },
    });
    return {
      id: row.id,
      placeId: row.placeId,
      elementId: row.elementId ?? undefined,
      feedKey: row.feedKey,
      statusPayload: row.statusPayload as Record<string, unknown>,
      sourceType: row.sourceType,
      observedAt: row.observedAt.toISOString(),
      expiresAt: row.expiresAt?.toISOString(),
    };
  }

  async getLiveSnapshot(
    placeId: string,
    feedKey: string,
  ): Promise<LiveStatusSnapshot | null> {
    const row = await prisma.aiLiveStatusSnapshot.findUnique({
      where: { placeId_feedKey: { placeId, feedKey } },
    });
    if (!row) return null;
    return {
      id: row.id,
      placeId: row.placeId,
      elementId: row.elementId ?? undefined,
      feedKey: row.feedKey,
      statusPayload: row.statusPayload as Record<string, unknown>,
      sourceType: row.sourceType,
      observedAt: row.observedAt.toISOString(),
      expiresAt: row.expiresAt?.toISOString(),
    };
  }

  async listLiveSnapshots(placeId: string): Promise<LiveStatusSnapshot[]> {
    const rows = await prisma.aiLiveStatusSnapshot.findMany({
      where: { placeId },
      orderBy: { observedAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      placeId: row.placeId,
      elementId: row.elementId ?? undefined,
      feedKey: row.feedKey,
      statusPayload: row.statusPayload as Record<string, unknown>,
      sourceType: row.sourceType,
      observedAt: row.observedAt.toISOString(),
      expiresAt: row.expiresAt?.toISOString(),
    }));
  }
}
