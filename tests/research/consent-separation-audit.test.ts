import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  researchConsentRecord: {
    upsert: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/config/analytics-research", () => ({
  analyticsResearchConfig: { researchGovernanceEnabled: true },
  ensureResearchGovernanceEnabled: vi.fn(),
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/consent/consent-service", () => ({
  checkConsent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import {
  assertConsentLanesAreIndependent,
  auditConsentSeparation,
  verifyCoreNavigationIndependentOfResearch,
  verifyGovernanceAuditRetention,
  verifyWithdrawalBlocksCollection,
} from "@/lib/research/consent-separation";
import {
  grantResearchPurposeConsent,
  withdrawResearchPurposeConsent,
} from "@/lib/research/co-design-governance-service";

describe("consent separation audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("research consent does not imply service consent by design", () => {
    const lanes = assertConsentLanesAreIndependent();
    expect(lanes.researchImpliesService).toBe(false);
    expect(lanes.serviceImpliesResearch).toBe(false);
  });

  it("research-only consent does not grant service access", async () => {
    const { checkConsent } = await import("@/lib/consent/consent-service");

    prismaMock.researchConsentRecord.findUnique.mockResolvedValue({
      participantId: "user-1",
      programmeId: "prog-1",
      purpose: "data_collection",
      status: "granted",
      grantedAt: new Date(),
      withdrawnAt: null,
    });
    vi.mocked(checkConsent).mockResolvedValue(false);

    const audit = await auditConsentSeparation({
      participantId: "user-1",
      programmeId: "prog-1",
      researchPurpose: "data_collection",
      serviceScope: "go.route_history",
    });

    expect(audit.researchActive).toBe(true);
    expect(audit.serviceActive).toBe(false);
    expect(audit.researchDoesNotImplyService).toBe(true);
  });

  it("service consent does not imply research consent", async () => {
    const { checkConsent } = await import("@/lib/consent/consent-service");

    prismaMock.researchConsentRecord.findUnique.mockResolvedValue(null);
    vi.mocked(checkConsent).mockResolvedValue(true);

    const audit = await auditConsentSeparation({
      participantId: "user-2",
      programmeId: "prog-1",
      researchPurpose: "interviews",
      serviceScope: "profile.read",
    });

    expect(audit.researchActive).toBe(false);
    expect(audit.serviceActive).toBe(true);
    expect(audit.serviceDoesNotImplyResearch).toBe(true);
  });

  it("core navigation does not require research enrolment", () => {
    expect(verifyCoreNavigationIndependentOfResearch()).toBe(true);
  });
});

describe("withdrawal stops collection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks collection after research consent withdrawal", async () => {
    prismaMock.researchConsentRecord.findUnique.mockResolvedValue({
      participantId: "user-1",
      programmeId: "prog-1",
      purpose: "data_collection",
      status: "withdrawn",
      grantedAt: new Date("2026-01-01"),
      withdrawnAt: new Date("2026-06-01"),
    });

    const result = await verifyWithdrawalBlocksCollection({
      participantId: "user-1",
      programmeId: "prog-1",
      purpose: "data_collection",
    });

    expect(result.canCollect).toBe(false);
    expect(result.reason).toBe("withdrawn");
  });

  it("withdrawResearchPurposeConsent sets withdrawn status", async () => {
    prismaMock.researchConsentRecord.update.mockResolvedValue({
      id: "consent-1",
      status: "withdrawn",
      withdrawnAt: new Date(),
    });

    const record = await withdrawResearchPurposeConsent({
      participantId: "user-1",
      programmeId: "prog-1",
      purpose: "field_validation",
      actorUserId: "user-1",
    });

    expect(record.status).toBe("withdrawn");
    expect(prismaMock.researchConsentRecord.update).toHaveBeenCalled();
  });

  it("allows collection when consent is granted and not withdrawn", async () => {
    prismaMock.researchConsentRecord.findUnique.mockResolvedValue({
      participantId: "user-1",
      programmeId: "prog-1",
      purpose: "data_collection",
      status: "granted",
      grantedAt: new Date(),
      withdrawnAt: null,
    });

    const result = await verifyWithdrawalBlocksCollection({
      participantId: "user-1",
      programmeId: "prog-1",
      purpose: "data_collection",
    });

    expect(result.canCollect).toBe(true);
  });
});

describe("governance audit retention", () => {
  it("retains auditable decision records without diagnosis fields", () => {
    const records = [
      {
        id: "dec-1",
        decisionTitle: "Route uncertainty copy approved",
        plainLanguageSummary:
          "Participants preferred plain language when evidence is stale.",
        participantVisible: true,
        decidedAt: new Date(),
      },
    ];

    expect(verifyGovernanceAuditRetention(records)).toBe(true);
  });

  it("rejects governance records containing diagnosis references", () => {
    const records = [
      {
        id: "dec-2",
        decisionTitle: "Invalid record",
        plainLanguageSummary: "Based on participant diagnosis of X",
        participantVisible: true,
        decidedAt: new Date(),
      },
    ];

    expect(verifyGovernanceAuditRetention(records)).toBe(false);
  });
});

describe("grant research consent", () => {
  it("grantResearchPurposeConsent does not create service consent", async () => {
    const { checkConsent } = await import("@/lib/consent/consent-service");

    prismaMock.researchConsentRecord.upsert.mockResolvedValue({
      id: "consent-1",
      status: "granted",
      purpose: "data_collection",
    });

    await grantResearchPurposeConsent({
      participantId: "user-1",
      programmeId: "prog-1",
      purpose: "data_collection",
      actorUserId: "user-1",
    });

    expect(prismaMock.researchConsentRecord.upsert).toHaveBeenCalled();
    expect(checkConsent).not.toHaveBeenCalled();
  });
});
