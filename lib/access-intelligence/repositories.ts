import { recordAuditEvent } from "./audit";
import { accessIntelligenceConfig, isDemoMode } from "./configuration";
import {
  createDemoPassports,
  DEMO_GRAPHS,
  DEMO_INCIDENTS,
  DEMO_USER_ID,
  findDemoDestinationNode,
  findDemoEntranceNodes,
  getDemoGraph,
} from "./demo-data";
import { AccessIntelligenceError } from "./errors";
import { ACCESS_ONTOLOGY } from "./ontology";
import { PrismaAccessIntelligenceRepository } from "./prisma-repository";
import type {
  AccessAuditEvent,
  AccessFeature,
  AccessPassport,
  AccessRequirement,
  LiveIncident,
  Place,
  VisitPlan,
} from "./schemas";
import type { AccessGraph, PlaceSearchResult } from "./types";

export type VerificationRequest = {
  id: string;
  userId: string;
  placeId: string;
  questions: string[];
  recipient: string;
  purpose: string;
  status: "draft" | "sent" | "cancelled";
  createdAt: string;
};

export type BarrierReport = {
  id: string;
  userId: string;
  placeId: string;
  elementId?: string;
  description: string;
  status: "draft" | "published" | "cancelled";
  createdAt: string;
};

export type PassportShareRecord = {
  id: string;
  userId: string;
  passportId: string;
  recipient: string;
  purpose: string;
  fieldsShared: string[];
  durationHours?: number;
  createdAt: string;
};

export interface AccessIntelligenceRepository {
  listPassports(userId: string): Promise<AccessPassport[]>;
  getPassport(userId: string, passportId: string): Promise<AccessPassport>;
  savePassport(passport: AccessPassport): Promise<AccessPassport>;
  deletePassport(userId: string, passportId: string): Promise<void>;
  searchPlaces(query: string): Promise<PlaceSearchResult[]>;
  getPlace(placeId: string): Promise<Place>;
  readAccessGraph(placeId: string): Promise<AccessGraph>;
  getLiveIncidents(placeId: string): Promise<LiveIncident[]>;
  findDestinationNodeId(placeId: string, destination: string): Promise<string>;
  findPreferredEntranceNodeId(
    placeId: string,
    options?: { preferStepFree?: boolean },
  ): Promise<string>;
  saveVisitPlan(plan: VisitPlan): Promise<VisitPlan>;
  listVisitPlans(userId: string): Promise<VisitPlan[]>;
  getVisitPlan(userId: string, planId: string): Promise<VisitPlan>;
  createVerificationRequest(
    request: Omit<VerificationRequest, "id" | "createdAt" | "status">,
  ): Promise<VerificationRequest>;
  createBarrierReport(
    report: Omit<BarrierReport, "id" | "createdAt" | "status">,
  ): Promise<BarrierReport>;
  listBarrierReports(placeId?: string): Promise<BarrierReport[]>;
  sharePassport(
    share: Omit<PassportShareRecord, "id" | "createdAt">,
  ): Promise<PassportShareRecord>;
  getVenueDashboard(placeId: string): Promise<{
    place: Place;
    unknownFeatureTypes: string[];
    activeIncidents: LiveIncident[];
    disputedFeatures: AccessFeature[];
    evidenceGaps: string[];
    remediationHints: Array<{ title: string; reason: string }>;
  }>;
}

const passportStore = new Map<string, AccessPassport[]>();
const visitPlans: VisitPlan[] = [];
const verificationRequests: VerificationRequest[] = [];
const barrierReports: BarrierReport[] = [];
const passportShares: PassportShareRecord[] = [];

function ensurePassports(userId: string): AccessPassport[] {
  if (!passportStore.has(userId)) {
    passportStore.set(
      userId,
      createDemoPassports(userId.length > 0 ? userId : DEMO_USER_ID),
    );
  }
  return passportStore.get(userId)!;
}

class DemoAccessIntelligenceRepository implements AccessIntelligenceRepository {
  async listPassports(userId: string): Promise<AccessPassport[]> {
    return ensurePassports(userId).map((p) => structuredClone(p));
  }

  async getPassport(userId: string, passportId: string): Promise<AccessPassport> {
    const found = ensurePassports(userId).find((p) => p.id === passportId);
    if (!found || found.userId !== userId) {
      throw new AccessIntelligenceError(
        "PASSPORT_NOT_FOUND",
        "Access Passport was not found.",
        "Select another passport or create a new one.",
      );
    }
    return structuredClone(found);
  }

  async savePassport(passport: AccessPassport): Promise<AccessPassport> {
    const list = ensurePassports(passport.userId);
    const idx = list.findIndex((p) => p.id === passport.id);
    const next = {
      ...passport,
      updatedAt: new Date().toISOString(),
    };
    if (next.isDefault) {
      for (const p of list) p.isDefault = false;
    }
    if (idx >= 0) list[idx] = next;
    else list.push(next);
    return structuredClone(next);
  }

  async deletePassport(userId: string, passportId: string): Promise<void> {
    const list = ensurePassports(userId);
    const idx = list.findIndex((p) => p.id === passportId && p.userId === userId);
    if (idx < 0) {
      throw new AccessIntelligenceError(
        "PASSPORT_NOT_FOUND",
        "Access Passport was not found.",
        "Refresh the passport list and try again.",
      );
    }
    list.splice(idx, 1);
  }

  async searchPlaces(query: string): Promise<PlaceSearchResult[]> {
    const q = query.toLowerCase().trim();
    return DEMO_GRAPHS.filter(
      (g) =>
        g.place.name.toLowerCase().includes(q) ||
        g.place.address.toLowerCase().includes(q) ||
        g.place.category.toLowerCase().includes(q) ||
        q.split(/\s+/).some((token) => g.place.name.toLowerCase().includes(token)),
    ).map((g) => ({
      place: g.place,
      matchReason: `Matched demo place "${g.place.name}"`,
    }));
  }

  async getPlace(placeId: string): Promise<Place> {
    const graph = getDemoGraph(placeId);
    if (!graph) {
      throw new AccessIntelligenceError(
        "PLACE_NOT_FOUND",
        "Place was not found.",
        "Search again or choose a demo place such as Harbour Civic Centre.",
      );
    }
    return structuredClone(graph.place);
  }

  async readAccessGraph(placeId: string): Promise<AccessGraph> {
    const graph = getDemoGraph(placeId);
    if (!graph) {
      throw new AccessIntelligenceError(
        "PLACE_NOT_FOUND",
        "Access graph was not found for this place.",
        "Confirm the place id and try again.",
      );
    }
    return structuredClone(graph);
  }

  async getLiveIncidents(placeId: string): Promise<LiveIncident[]> {
    return DEMO_INCIDENTS.filter((i) => i.placeId === placeId).map((i) =>
      structuredClone(i),
    );
  }

  async findDestinationNodeId(
    placeId: string,
    destination: string,
  ): Promise<string> {
    const node = findDemoDestinationNode(placeId, destination);
    if (!node) {
      throw new AccessIntelligenceError(
        "DESTINATION_NOT_FOUND",
        `Destination "${destination}" was not found.`,
        "Try a room label such as Interview Room 3.12 or Study Room 2.04.",
      );
    }
    return node.id;
  }

  async findPreferredEntranceNodeId(
    placeId: string,
    options?: { preferStepFree?: boolean },
  ): Promise<string> {
    const entrances = findDemoEntranceNodes(placeId);
    if (entrances.length === 0) {
      throw new AccessIntelligenceError(
        "DESTINATION_NOT_FOUND",
        "No entrance nodes found.",
        "The place access graph may be incomplete.",
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
    visitPlans.push(plan);
    return plan;
  }

  async listVisitPlans(userId: string): Promise<VisitPlan[]> {
    return visitPlans.filter((p) => p.userId === userId).map((p) => structuredClone(p));
  }

  async getVisitPlan(userId: string, planId: string): Promise<VisitPlan> {
    const found = visitPlans.find((p) => p.id === planId && p.userId === userId);
    if (!found) {
      throw new AccessIntelligenceError(
        "PLACE_NOT_FOUND",
        "Visit plan was not found.",
        "Return to saved plans and try again.",
      );
    }
    return structuredClone(found);
  }

  async createVerificationRequest(
    request: Omit<VerificationRequest, "id" | "createdAt" | "status">,
  ): Promise<VerificationRequest> {
    const full: VerificationRequest = {
      ...request,
      id: `verify-${Date.now()}`,
      status: "sent",
      createdAt: new Date().toISOString(),
    };
    verificationRequests.push(full);
    recordAuditEvent({
      action: "request_venue_verification",
      actorUserId: request.userId,
      purpose: request.purpose,
      fieldsShared: request.questions,
      recipient: request.recipient,
      outcome: "executed",
      metadata: { placeId: request.placeId },
    });
    return full;
  }

  async createBarrierReport(
    report: Omit<BarrierReport, "id" | "createdAt" | "status">,
  ): Promise<BarrierReport> {
    const full: BarrierReport = {
      ...report,
      id: `barrier-${Date.now()}`,
      status: "published",
      createdAt: new Date().toISOString(),
    };
    barrierReports.push(full);
    recordAuditEvent({
      action: "submit_barrier_report",
      actorUserId: report.userId,
      purpose: "community_barrier_report",
      fieldsShared: ["description", "placeId"],
      recipient: "community_moderation",
      outcome: "executed",
      metadata: { placeId: report.placeId, elementId: report.elementId },
    });
    return full;
  }

  async listBarrierReports(placeId?: string): Promise<BarrierReport[]> {
    return barrierReports
      .filter((r) => (placeId ? r.placeId === placeId : true))
      .map((r) => structuredClone(r));
  }

  async sharePassport(
    share: Omit<PassportShareRecord, "id" | "createdAt">,
  ): Promise<PassportShareRecord> {
    const full: PassportShareRecord = {
      ...share,
      id: `share-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    passportShares.push(full);
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
    const remediationHints = [
      ...activeIncidents.map((i) => ({
        title: `Resolve ${i.type.replaceAll("_", " ")}`,
        reason: i.description,
      })),
      ...unknownFeatureTypes.slice(0, 5).map((t) => ({
        title: `Collect evidence for ${t.replaceAll("_", " ")}`,
        reason: "Route-relevant feature has no recorded claim.",
      })),
    ];
    return {
      place: graph.place,
      unknownFeatureTypes,
      activeIncidents,
      disputedFeatures,
      evidenceGaps,
      remediationHints,
    };
  }
}

let repositorySingleton: AccessIntelligenceRepository | null = null;

export function getAccessIntelligenceRepository(): AccessIntelligenceRepository {
  if (!repositorySingleton) {
    if (process.env.ACCESS_INTELLIGENCE_USE_PRISMA === "true") {
      repositorySingleton = new PrismaAccessIntelligenceRepository();
    } else {
      repositorySingleton = new DemoAccessIntelligenceRepository();
    }
  }
  return repositorySingleton;
}

export function resetDemoRepositoryForTests(): void {
  passportStore.clear();
  visitPlans.length = 0;
  verificationRequests.length = 0;
  barrierReports.length = 0;
  passportShares.length = 0;
  repositorySingleton = new DemoAccessIntelligenceRepository();
}

export function listDemoVerificationRequests(): VerificationRequest[] {
  return [...verificationRequests];
}

export function listDemoBarrierReports(): BarrierReport[] {
  return [...barrierReports];
}

export function duplicatePassport(
  passport: AccessPassport,
  newName: string,
): AccessPassport {
  const now = new Date().toISOString();
  return {
    ...structuredClone(passport),
    id: `passport-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: newName,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
    requirements: passport.requirements.map((r: AccessRequirement, i) => ({
      ...r,
      id: `req-${Date.now()}-${i}`,
    })),
  };
}

export function getModuleConfigSummary() {
  return {
    demoMode: isDemoMode(),
    modelId: accessIntelligenceConfig.modelId,
    demoUserId: accessIntelligenceConfig.demoUserId,
  };
}

export type { AccessAuditEvent };
