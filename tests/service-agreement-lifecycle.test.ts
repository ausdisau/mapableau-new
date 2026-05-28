import { beforeEach, describe, expect, it, vi } from "vitest";

const agreementStore = {
  id: "agreement_1",
  participantId: "participant_1",
  organisationId: "org_1",
  agreementType: "care",
  title: "Support agreement",
  plainLanguageSummary: "Summary",
  startDate: new Date("2026-01-01T00:00:00.000Z"),
  endDate: new Date("2026-12-31T00:00:00.000Z"),
  fundingSourceId: null,
  serviceTypes: [],
  cancellationTerms: null,
  pricingSummary: null,
  participantResponsibilities: null,
  providerResponsibilities: null,
  accessCommunicationNotes: null,
  status: "participant_review",
  createdById: "admin_1",
  signedByParticipantId: null,
  signedByProviderId: "provider_1",
  participantSignedAt: null,
  providerSignedAt: new Date("2026-01-01T00:00:00.000Z"),
  documentId: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const prismaMock = {
  serviceAgreement: {
    findUnique: vi.fn(async () => ({ ...agreementStore })),
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      ...agreementStore,
      ...data,
    })),
    findMany: vi.fn(async () => []),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      ...agreementStore,
      ...data,
    })),
  },
  serviceAgreementRevision: {
    create: vi.fn(async () => ({
      id: "rev_1",
      agreementId: agreementStore.id,
      authorUserId: "user_1",
      summary: "revision",
      changeSetJson: {},
      createdAt: new Date(),
    })),
    findMany: vi.fn(async () => []),
  },
  $transaction: vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)),
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/attestations/attestation-service", () => ({
  createAttestation: vi.fn(async () => undefined),
}));

vi.mock("@/lib/contracts/contract-runner", () => ({
  runSmartContract: vi.fn(async () => ({
    result: "passed",
    run: { id: "run_1" },
    findings: [],
  })),
}));

describe("service agreement lifecycle service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    agreementStore.status = "participant_review";
    agreementStore.signedByParticipantId = null;
    agreementStore.participantSignedAt = null;
    agreementStore.signedByProviderId = "provider_1";
    agreementStore.providerSignedAt = new Date("2026-01-01T00:00:00.000Z");
  });

  it("marks agreement signed when second party signs", async () => {
    const { signAgreement } = await import(
      "@/lib/service-agreements/lifecycle-service"
    );
    const result = await signAgreement({
      agreementId: agreementStore.id,
      signerUserId: "participant_1",
      role: "participant",
    });
    expect(result.status).toBe("signed");
  });

  it("blocks activation when compliance check fails", async () => {
    const contracts = await import("@/lib/contracts/contract-runner");
    vi.mocked(contracts.runSmartContract).mockResolvedValueOnce({
      result: "review_required",
      run: { id: "run_blocked" },
      findings: [{ code: "x", message: "blocked", severity: "error" }],
    });

    const { activateAgreement, ServiceAgreementLifecycleError } = await import(
      "@/lib/service-agreements/lifecycle-service"
    );
    agreementStore.status = "signed";
    agreementStore.participantSignedAt = new Date("2026-01-02T00:00:00.000Z");

    await expect(
      activateAgreement({
        agreementId: agreementStore.id,
        actorUserId: "admin_1",
      })
    ).rejects.toBeInstanceOf(ServiceAgreementLifecycleError);
  });

  it("records negotiation updates and moves to participant review", async () => {
    const { markNegotiationUpdate } = await import(
      "@/lib/service-agreements/lifecycle-service"
    );
    agreementStore.status = "signed";
    const result = await markNegotiationUpdate({
      agreementId: agreementStore.id,
      authorUserId: "provider_1",
      summary: "Updated transport terms",
      changeSetJson: { field: "pricingSummary" },
    });
    expect(result.agreement.status).toBe("participant_review");
    expect(result.revision.id).toBeDefined();
  });
});
