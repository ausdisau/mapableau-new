import type { LearningTraceEvent, LivingAccessTwin, VenueMutation } from "../living/schemas";
import type { LiveIncident } from "../schemas";

export type VenueStaffRole = "venue_staff" | "venue_admin";

export type VenueStaffAssignment = {
  id: string;
  userId: string;
  placeId: string;
  role: VenueStaffRole;
  createdAt: string;
  updatedAt: string;
};

export type MutationDraftRecord = {
  id: string;
  placeId: string;
  userId: string;
  mutationId: string;
  mutation: VenueMutation;
  status: "draft" | "discarded";
  createdAt: string;
  updatedAt: string;
};

export type LearningSessionRecord = {
  id: string;
  userId: string;
  scenarioId: string;
  stage: string;
  snapshot: Record<string, unknown>;
  events: LearningTraceEvent[];
  createdAt: string;
  updatedAt: string;
};

export type LiveStatusSnapshot = {
  id: string;
  placeId: string;
  elementId?: string;
  feedKey: string;
  statusPayload: Record<string, unknown>;
  sourceType: string;
  observedAt: string;
  expiresAt?: string;
};

/**
 * Persistence boundary for Living Building twin operational data.
 * Demo defaults to memory; production enables Prisma via env flags.
 */
export interface LivingPersistence {
  readonly kind: "memory" | "prisma";

  /** Ensure Harbour (or other) twin graph rows exist when using Prisma. */
  ensureTwinSeeded(placeId: string): Promise<void>;

  loadIncidents(placeId: string): Promise<LiveIncident[]>;
  saveIncident(incident: LiveIncident): Promise<LiveIncident>;
  updateIncident(
    incidentId: string,
    patch: Partial<Pick<LiveIncident, "status" | "expiresAt" | "description">>,
  ): Promise<LiveIncident>;

  saveMutationDraft(input: {
    placeId: string;
    userId: string;
    mutation: VenueMutation;
  }): Promise<MutationDraftRecord>;
  listMutationDrafts(userId: string, placeId?: string): Promise<MutationDraftRecord[]>;

  saveLearningSession(session: LearningSessionRecord): Promise<LearningSessionRecord>;
  getLearningSession(sessionId: string): Promise<LearningSessionRecord | null>;
  appendLearningTrace(
    sessionId: string,
    event: LearningTraceEvent,
  ): Promise<LearningSessionRecord>;

  listVenueStaff(placeId: string): Promise<VenueStaffAssignment[]>;
  upsertVenueStaff(input: {
    userId: string;
    placeId: string;
    role: VenueStaffRole;
  }): Promise<VenueStaffAssignment>;
  isVenueStaff(userId: string, placeId: string): Promise<boolean>;

  saveLiveSnapshot(snapshot: Omit<LiveStatusSnapshot, "id"> & { id?: string }): Promise<LiveStatusSnapshot>;
  getLiveSnapshot(placeId: string, feedKey: string): Promise<LiveStatusSnapshot | null>;
  listLiveSnapshots(placeId: string): Promise<LiveStatusSnapshot[]>;

  /** Optional: load twin meta / temporal rules when Prisma-backed. */
  loadTwinOverlay?(placeId: string): Promise<{
    twin?: LivingAccessTwin;
    temporalRuleCount: number;
  } | null>;
}
