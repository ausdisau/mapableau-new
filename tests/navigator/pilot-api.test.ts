import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireApiSession = vi.fn();

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: (...args: unknown[]) => requireApiSession(...args),
}));

vi.mock("@/lib/api/ip-rate-limit", () => ({
  getClientIp: () => "127.0.0.1",
  checkIpRateLimit: () => true,
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/consent/consent-receipt-service", () => ({
  createConsentReceipt: vi.fn(async () => ({ id: "receipt-used" })),
}));

vi.mock("@/lib/platform/multi-tenant-admin/tenant-service", () => ({
  userCanAccessTenant: vi.fn(async () => true),
  assertTenantAccess: vi.fn(async () => undefined),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: { findMany: vi.fn() },
    participantAuthorityGrant: { findFirst: vi.fn() },
    navigatorDecisionPassport: { findFirst: vi.fn() },
    navigatorGovernedMemoryItem: { findMany: vi.fn() },
    governedActionEnvelope: { findFirst: vi.fn() },
  },
}));

import { POST as postSession } from "@/app/api/navigator/pilot/sessions/route";
import { GET as getPassport } from "@/app/api/navigator/pilot/passport/route";
import { GET as getMemory } from "@/app/api/navigator/pilot/memory/route";
import { GET as getEnvelopeById } from "@/app/api/navigator/pilot/envelopes/[id]/route";
import { userCanAccessTenant } from "@/lib/platform/multi-tenant-admin/tenant-service";
import { NAVIGATOR_CONSENT_PURPOSE } from "@/lib/ai/navigator/consent-gate";
import { prisma } from "@/lib/prisma";

const FLAG_KEYS = [
  "MAPABLE_NAVIGATOR_PILOT_ENABLED",
  "MAPABLE_NAVIGATOR_PILOT_PASSPORT",
  "MAPABLE_NAVIGATOR_PILOT_MEMORY",
  "MAPABLE_NAVIGATOR_PILOT_ENVELOPES",
  "MAPABLE_NAVIGATOR_PILOT_MATCHING",
] as const;

const participant = {
  id: "p1",
  email: "p1@example.com",
  name: "Pilot Participant",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant" as const,
  roles: ["participant" as const],
};

function clearFlags() {
  for (const key of FLAG_KEYS) delete process.env[key];
}

function enablePilotFlags() {
  process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED = "true";
  process.env.MAPABLE_NAVIGATOR_PILOT_PASSPORT = "true";
  process.env.MAPABLE_NAVIGATOR_PILOT_MEMORY = "true";
  process.env.MAPABLE_NAVIGATOR_PILOT_ENVELOPES = "true";
  process.env.MAPABLE_NAVIGATOR_PILOT_MATCHING = "true";
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
  });
}

function jsonRequest(
  url: string,
  body: unknown,
  method = "POST",
): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockActiveConsent() {
  vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
    {
      id: "c-ok",
      purpose: NAVIGATOR_CONSENT_PURPOSE,
      status: "active",
      expiryDate: new Date(Date.now() + 60_000),
      dataScope: ["*"],
      sourceAction: "*",
      createdAt: new Date(),
    } as never,
  ]);
}

describe("Navigator pilot HTTP API", () => {
  beforeEach(() => {
    clearFlags();
    vi.clearAllMocks();
    requireApiSession.mockResolvedValue(participant);
    vi.mocked(userCanAccessTenant).mockResolvedValue(true);
    vi.mocked(prisma.participantAuthorityGrant.findFirst).mockResolvedValue(
      null,
    );
    mockActiveConsent();
  });

  afterEach(() => {
    clearFlags();
  });

  it("rejects unauthenticated session create", async () => {
    process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED = "true";
    requireApiSession.mockResolvedValue(unauthorized());
    const res = await postSession(
      jsonRequest("http://localhost/api/navigator/pilot/sessions", {
        tenantId: "t1",
        participantId: "p1",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when the pilot flag is off", async () => {
    const res = await postSession(
      jsonRequest("http://localhost/api/navigator/pilot/sessions", {
        tenantId: "t1",
        participantId: "p1",
      }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      error: "NAVIGATOR_PILOT_DISABLED",
    });
  });

  it("returns TENANT_FORBIDDEN when membership fails", async () => {
    enablePilotFlags();
    vi.mocked(userCanAccessTenant).mockResolvedValue(false);
    const res = await postSession(
      jsonRequest("http://localhost/api/navigator/pilot/sessions", {
        tenantId: "spoofed-tenant",
        participantId: "p1",
      }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      error: "TENANT_FORBIDDEN",
    });
  });

  it("returns FORBIDDEN when the actor is not the participant", async () => {
    enablePilotFlags();
    requireApiSession.mockResolvedValue({ ...participant, id: "other-user" });
    const res = await postSession(
      jsonRequest("http://localhost/api/navigator/pilot/sessions", {
        tenantId: "t1",
        participantId: "p1",
      }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      error: "FORBIDDEN",
    });
  });

  it("creates a session for a tenant member participant", async () => {
    enablePilotFlags();
    const res = await postSession(
      jsonRequest("http://localhost/api/navigator/pilot/sessions", {
        tenantId: "t1",
        participantId: "p1",
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      sessionId: string;
      tenantId: string;
      participantId: string;
    };
    expect(body.tenantId).toBe("t1");
    expect(body.participantId).toBe("p1");
    expect(body.sessionId.length).toBeGreaterThan(8);
  });

  it("denies passport GET without consent", async () => {
    enablePilotFlags();
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([]);
    const res = await getPassport(
      new Request(
        "http://localhost/api/navigator/pilot/passport?tenantId=t1&participantId=p1&id=pass-1",
      ),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      error: "NAVIGATOR_CONSENT_CONSENT_MISSING",
    });
  });

  it("denies passport GET for a spoofed tenant", async () => {
    enablePilotFlags();
    vi.mocked(userCanAccessTenant).mockResolvedValue(false);
    const res = await getPassport(
      new Request(
        "http://localhost/api/navigator/pilot/passport?tenantId=other&participantId=p1&id=pass-1",
      ),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      error: "TENANT_FORBIDDEN",
    });
    expect(prisma.navigatorDecisionPassport.findFirst).not.toHaveBeenCalled();
  });

  it("returns a passport when access and consent pass", async () => {
    enablePilotFlags();
    const now = new Date();
    vi.mocked(prisma.navigatorDecisionPassport.findFirst).mockResolvedValue({
      id: "pass-1",
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      sessionId: "sess-1",
      goalSummary: "Find support",
      interpretationJson: { summary: "support worker" },
      hardConstraintsJson: [],
      rankingWeightsJson: {},
      sourcesJson: [],
      shortlistJson: [],
      uncertaintyNotes: [],
      limitationsNotes: [],
      conflictsOfInterest: [],
      aiInvolved: false,
      modelIndependentRules: [],
      nextStep: null,
      nextStepController: "participant",
      consentedPurpose: NAVIGATOR_CONSENT_PURPOSE,
      consentRecordId: "c-ok",
      aiOptedOut: false,
      status: "active",
      correlationId: "corr-1",
      createdAt: now,
      updatedAt: now,
    } as never);

    const res = await getPassport(
      new Request(
        "http://localhost/api/navigator/pilot/passport?tenantId=t1&participantId=p1&id=pass-1",
      ),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { passport: { id: string } };
    expect(body.passport.id).toBe("pass-1");
  });

  it("denies memory list when the actor is not the participant", async () => {
    enablePilotFlags();
    requireApiSession.mockResolvedValue({ ...participant, id: "intruder" });
    const res = await getMemory(
      new Request(
        "http://localhost/api/navigator/pilot/memory?tenantId=t1&participantId=p1",
      ),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ error: "FORBIDDEN" });
    expect(prisma.navigatorGovernedMemoryItem.findMany).not.toHaveBeenCalled();
  });

  it("lists memory items for the participant", async () => {
    enablePilotFlags();
    vi.mocked(prisma.navigatorGovernedMemoryItem.findMany).mockResolvedValue(
      [],
    );
    const res = await getMemory(
      new Request(
        "http://localhost/api/navigator/pilot/memory?tenantId=t1&participantId=p1",
      ),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ items: [] });
  });

  it("omits nonce from envelope GET-by-id", async () => {
    enablePilotFlags();
    const now = new Date();
    vi.mocked(prisma.governedActionEnvelope.findFirst).mockResolvedValue({
      id: "env-1",
      tenantId: "t1",
      participantId: "p1",
      initiatingUserId: "p1",
      capabilityKey: "navigator.provider_search.draft_service_request",
      action: "transfer_filters_to_finder",
      payloadJson: { query: "support worker" },
      payloadHash: "hash",
      evidenceRefs: [],
      sourceRefs: [],
      modelVersion: null,
      promptVersion: null,
      toolVersion: null,
      consentReceiptId: "receipt-used",
      requiredApproverRole: "participant",
      nonce: "secret-nonce-must-not-leak",
      status: "proposed",
      approvalReason: null,
      rejectionReason: null,
      executionResult: null,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 60_000),
      consumedAt: null,
      auditEventIds: [],
    } as never);

    const res = await getEnvelopeById(
      new Request(
        "http://localhost/api/navigator/pilot/envelopes/env-1?tenantId=t1&participantId=p1",
      ),
      { params: Promise.resolve({ id: "env-1" }) },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { envelope: Record<string, unknown> };
    expect(body.envelope.id).toBe("env-1");
    expect(body.envelope).not.toHaveProperty("nonce");
    expect(JSON.stringify(body)).not.toContain("secret-nonce-must-not-leak");
  });
});
