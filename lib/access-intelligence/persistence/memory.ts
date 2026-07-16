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

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function now() {
  return new Date().toISOString();
}

export class MemoryLivingPersistence implements LivingPersistence {
  readonly kind = "memory" as const;

  private incidents = new Map<string, LiveIncident>();
  private drafts = new Map<string, MutationDraftRecord>();
  private sessions = new Map<string, LearningSessionRecord>();
  private staff = new Map<string, VenueStaffAssignment>();
  private snapshots = new Map<string, LiveStatusSnapshot>();

  async ensureTwinSeeded(): Promise<void> {
    // Graph remains in demo fixtures; nothing to seed in memory mode.
  }

  async loadIncidents(placeId: string): Promise<LiveIncident[]> {
    return [...this.incidents.values()].filter((i) => i.placeId === placeId);
  }

  async saveIncident(incident: LiveIncident): Promise<LiveIncident> {
    this.incidents.set(incident.id, incident);
    return incident;
  }

  async updateIncident(
    incidentId: string,
    patch: Partial<Pick<LiveIncident, "status" | "expiresAt" | "description">>,
  ): Promise<LiveIncident> {
    const existing = this.incidents.get(incidentId);
    if (!existing) {
      throw new Error(`Incident ${incidentId} not found`);
    }
    const next = { ...existing, ...patch };
    this.incidents.set(incidentId, next);
    return next;
  }

  async saveMutationDraft(input: {
    placeId: string;
    userId: string;
    mutation: VenueMutation;
  }): Promise<MutationDraftRecord> {
    const record: MutationDraftRecord = {
      id: id("draft"),
      placeId: input.placeId,
      userId: input.userId,
      mutationId: input.mutation.id,
      mutation: input.mutation,
      status: "draft",
      createdAt: now(),
      updatedAt: now(),
    };
    this.drafts.set(record.id, record);
    return record;
  }

  async listMutationDrafts(
    userId: string,
    placeId?: string,
  ): Promise<MutationDraftRecord[]> {
    return [...this.drafts.values()].filter(
      (d) => d.userId === userId && (!placeId || d.placeId === placeId),
    );
  }

  async saveLearningSession(
    session: LearningSessionRecord,
  ): Promise<LearningSessionRecord> {
    this.sessions.set(session.id, {
      ...session,
      updatedAt: now(),
    });
    return this.sessions.get(session.id)!;
  }

  async getLearningSession(
    sessionId: string,
  ): Promise<LearningSessionRecord | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async appendLearningTrace(
    sessionId: string,
    event: LearningTraceEvent,
  ): Promise<LearningSessionRecord> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Learning session ${sessionId} not found`);
    const next = {
      ...session,
      events: [...session.events, event],
      updatedAt: now(),
    };
    this.sessions.set(sessionId, next);
    return next;
  }

  async listVenueStaff(placeId: string): Promise<VenueStaffAssignment[]> {
    return [...this.staff.values()].filter((s) => s.placeId === placeId);
  }

  async upsertVenueStaff(input: {
    userId: string;
    placeId: string;
    role: VenueStaffRole;
  }): Promise<VenueStaffAssignment> {
    const key = `${input.userId}::${input.placeId}`;
    const existing = this.staff.get(key);
    const record: VenueStaffAssignment = {
      id: existing?.id ?? id("staff"),
      userId: input.userId,
      placeId: input.placeId,
      role: input.role,
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    };
    this.staff.set(key, record);
    return record;
  }

  async isVenueStaff(userId: string, placeId: string): Promise<boolean> {
    return this.staff.has(`${userId}::${placeId}`);
  }

  async saveLiveSnapshot(
    snapshot: Omit<LiveStatusSnapshot, "id"> & { id?: string },
  ): Promise<LiveStatusSnapshot> {
    const key = `${snapshot.placeId}::${snapshot.feedKey}`;
    const record: LiveStatusSnapshot = {
      id: snapshot.id ?? id("snap"),
      placeId: snapshot.placeId,
      elementId: snapshot.elementId,
      feedKey: snapshot.feedKey,
      statusPayload: snapshot.statusPayload,
      sourceType: snapshot.sourceType,
      observedAt: snapshot.observedAt,
      expiresAt: snapshot.expiresAt,
    };
    this.snapshots.set(key, record);
    return record;
  }

  async getLiveSnapshot(
    placeId: string,
    feedKey: string,
  ): Promise<LiveStatusSnapshot | null> {
    return this.snapshots.get(`${placeId}::${feedKey}`) ?? null;
  }

  async listLiveSnapshots(placeId: string): Promise<LiveStatusSnapshot[]> {
    return [...this.snapshots.values()].filter((s) => s.placeId === placeId);
  }
}

let memorySingleton: MemoryLivingPersistence | null = null;

export function getMemoryLivingPersistence(): MemoryLivingPersistence {
  if (!memorySingleton) memorySingleton = new MemoryLivingPersistence();
  return memorySingleton;
}

export function resetMemoryLivingPersistenceForTests(): void {
  memorySingleton = new MemoryLivingPersistence();
}
