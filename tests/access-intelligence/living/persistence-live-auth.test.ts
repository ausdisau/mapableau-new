import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  allowDemoRolePreview,
  userHasVenueOperateAccess,
} from "@/lib/access-intelligence/auth/venue-access";
import { resolveLiveStatus } from "@/lib/access-intelligence/live";
import { DemoLiveStatusAdapter } from "@/lib/access-intelligence/live/demo-adapter";
import { HttpBmsLiveStatusAdapter } from "@/lib/access-intelligence/live/http-bms-adapter";
import { HARBOUR_PLACE_ID } from "@/lib/access-intelligence/living/harbour-civic";
import {
  getLivingPersistence,
  resetLivingPersistenceForTests,
} from "@/lib/access-intelligence/persistence";
import type { CurrentUser } from "@/lib/auth/current-user";

function demoUser(overrides?: Partial<CurrentUser>): CurrentUser {
  return {
    id: "user-demo",
    email: "demo@example.com",
    name: "Demo",
    phone: null,
    timezone: "Australia/Sydney",
    locale: "en-AU",
    primaryRole: "participant",
    roles: ["participant"],
    ...overrides,
  };
}

describe("venue operate access gates", () => {
  const prevDemo = process.env.ACCESS_INTELLIGENCE_DEMO_MODE;
  const prevPreview = process.env.ACCESS_INTELLIGENCE_ALLOW_DEMO_ROLE_PREVIEW;

  afterEach(() => {
    process.env.ACCESS_INTELLIGENCE_DEMO_MODE = prevDemo;
    process.env.ACCESS_INTELLIGENCE_ALLOW_DEMO_ROLE_PREVIEW = prevPreview;
    resetLivingPersistenceForTests();
  });

  it("honours demo_preview header only when demo mode is on", async () => {
    process.env.ACCESS_INTELLIGENCE_DEMO_MODE = "true";
    delete process.env.ACCESS_INTELLIGENCE_ALLOW_DEMO_ROLE_PREVIEW;
    expect(allowDemoRolePreview()).toBe(true);

    const allowed = await userHasVenueOperateAccess({
      user: demoUser(),
      placeId: HARBOUR_PLACE_ID,
      roleHeader: "demo_preview",
    });
    expect(allowed.allowed).toBe(true);
    expect(allowed.effectiveRole).toBe("venue_staff");
  });

  it("rejects demo_preview header when demo mode is off", async () => {
    process.env.ACCESS_INTELLIGENCE_DEMO_MODE = "false";
    const denied = await userHasVenueOperateAccess({
      user: demoUser(),
      placeId: HARBOUR_PLACE_ID,
      roleHeader: "demo_preview",
    });
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toMatch(/ignored in production|Not authorised/i);
  });

  it("allows mapable_admin without header", async () => {
    process.env.ACCESS_INTELLIGENCE_DEMO_MODE = "false";
    const allowed = await userHasVenueOperateAccess({
      user: demoUser({
        primaryRole: "mapable_admin",
        roles: ["mapable_admin"],
      }),
      placeId: HARBOUR_PLACE_ID,
      roleHeader: null,
    });
    expect(allowed.allowed).toBe(true);
    expect(allowed.effectiveRole).toBe("mapable_admin");
  });

  it("allows AiVenueStaffAssignment without preview header", async () => {
    process.env.ACCESS_INTELLIGENCE_DEMO_MODE = "false";
    const persistence = getLivingPersistence();
    await persistence.upsertVenueStaff({
      userId: "staff-1",
      placeId: HARBOUR_PLACE_ID,
      role: "venue_staff",
    });
    const allowed = await userHasVenueOperateAccess({
      user: demoUser({ id: "staff-1" }),
      placeId: HARBOUR_PLACE_ID,
      roleHeader: null,
    });
    expect(allowed.allowed).toBe(true);
  });
});

describe("living persistence (memory)", () => {
  beforeEach(() => {
    resetLivingPersistenceForTests();
  });

  it("persists incidents, drafts, and learning traces", async () => {
    const p = getLivingPersistence();
    expect(p.kind).toBe("memory");

    const incident = await p.saveIncident({
      id: "inc-test-1",
      placeId: HARBOUR_PLACE_ID,
      type: "lift_outage",
      severity: "high",
      description: "Test outage",
      sourceType: "venue_attestation",
      reportedAt: new Date().toISOString(),
      status: "active",
      affectedEdgeIds: ["e-hcc-lift"],
    });
    expect((await p.loadIncidents(HARBOUR_PLACE_ID)).map((i) => i.id)).toContain(
      incident.id,
    );

    const draft = await p.saveMutationDraft({
      placeId: HARBOUR_PLACE_ID,
      userId: "u1",
      mutation: {
        id: "mut-ent-b-evening",
        title: "Keep Entrance B open",
        description: "demo",
        mutationType: "change_opening_hours",
        after: { closesAfterHourLocal: 22 },
        estimatedEffort: "low",
        estimatedCostBand: "operational",
        evidenceRequiredAfterCompletion: ["hours"],
      },
    });
    expect(await p.listMutationDrafts("u1", HARBOUR_PLACE_ID)).toHaveLength(1);
    expect(draft.mutationId).toBe("mut-ent-b-evening");

    await p.saveLearningSession({
      id: "flight-1",
      userId: "u1",
      scenarioId: "interview-level-3",
      stage: "prediction",
      snapshot: { hintLevel: 0 },
      events: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await p.appendLearningTrace("flight-1", {
      type: "prediction_submitted",
      status: "suitable_with_conditions",
      confidence: 60,
      timestamp: new Date().toISOString(),
    });
    const session = await p.getLearningSession("flight-1");
    expect(session?.events).toHaveLength(1);
  });
});

describe("live status adapters + fallback", () => {
  beforeEach(() => {
    resetLivingPersistenceForTests();
  });

  it("demo adapter returns western lift degraded status", async () => {
    const rows = await new DemoLiveStatusAdapter().fetchObservations({
      placeId: HARBOUR_PLACE_ID,
      subjectKind: "element",
      subjectId: "hcc-lift-west",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("degraded");
  });

  it("HTTP BMS adapter returns [] on network failure (no throw)", async () => {
    const adapter = new HttpBmsLiveStatusAdapter({
      baseUrl: "http://127.0.0.1:1",
      timeoutMs: 50,
    });
    await expect(
      adapter.fetchObservations({ placeId: HARBOUR_PLACE_ID }),
    ).resolves.toEqual([]);
  });

  it("resolveLiveStatus uses live demo feed and stores snapshot", async () => {
    process.env.ACCESS_INTELLIGENCE_DEMO_MODE = "true";
    delete process.env.ACCESS_INTELLIGENCE_BMS_URL;

    const resolved = await resolveLiveStatus({
      placeId: HARBOUR_PLACE_ID,
      subjectKind: "element",
      subjectId: "hcc-lift-west",
    });
    expect(resolved.resolution).toBe("live");
    expect(resolved.observation?.status).toBe("degraded");

    const snap = await getLivingPersistence().getLiveSnapshot(
      HARBOUR_PLACE_ID,
      "element:hcc-lift-west",
    );
    expect(snap?.statusPayload.status).toBe("degraded");
  });

  it("falls back to last-known snapshot when live adapters empty", async () => {
    const persistence = getLivingPersistence();
    await persistence.saveLiveSnapshot({
      placeId: HARBOUR_PLACE_ID,
      feedKey: "element:hcc-lift",
      statusPayload: {
        status: "unavailable",
        summary: "Cached main-lift outage",
        subjectKind: "element",
        subjectId: "hcc-lift",
        confidence: 0.9,
      },
      sourceType: "system_feed",
      observedAt: new Date().toISOString(),
    });

    vi.spyOn(DemoLiveStatusAdapter.prototype, "fetchObservations").mockResolvedValue(
      [],
    );

    const resolved = await resolveLiveStatus({
      placeId: HARBOUR_PLACE_ID,
      subjectKind: "element",
      subjectId: "hcc-lift",
    });
    expect(resolved.resolution).toBe("last_known_snapshot");
    expect(resolved.observation?.summary).toMatch(/Cached main-lift/);
    vi.restoreAllMocks();
  });
});
