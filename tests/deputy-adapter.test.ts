import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mappingFindUnique,
  mappingUpsert,
  deliveryFindUnique,
  deliveryCreate,
  deliveryUpdate,
  reconCreate,
  connectionFindUnique,
  connectionUpdate,
} = vi.hoisted(() => ({
  mappingFindUnique: vi.fn(),
  mappingUpsert: vi.fn(),
  deliveryFindUnique: vi.fn(),
  deliveryCreate: vi.fn(),
  deliveryUpdate: vi.fn(),
  reconCreate: vi.fn(),
  connectionFindUnique: vi.fn(),
  connectionUpdate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    integrationExternalMapping: {
      findUnique: mappingFindUnique,
      upsert: mappingUpsert,
    },
    integrationDelivery: {
      findUnique: deliveryFindUnique,
      create: deliveryCreate,
      update: deliveryUpdate,
    },
    integrationReconciliation: {
      create: reconCreate,
    },
    billingIntegrationConnection: {
      findUnique: connectionFindUnique,
      update: connectionUpdate,
      upsert: vi.fn(),
    },
  },
}));

import {
  isAllowedDeputyHostname,
  parseDeputyEndpoint,
} from "@/lib/integrations/deputy/hostname";
import {
  createDeputyOAuthState,
  parseDeputyOAuthState,
} from "@/lib/integrations/deputy/oauth";
import { createUnpublishedDraftRoster } from "@/lib/integrations/deputy/roster";
import {
  spansSydneyDstTransition,
  formatSydney,
} from "@/lib/integrations/deputy/timezone";
import {
  ingestDeputyWebhook,
  verifyDeputyWebhookSignature,
} from "@/lib/integrations/deputy/webhooks";

describe("Deputy hostname allowlist (SSRF)", () => {
  it("allows regional deputy hosts", () => {
    expect(isAllowedDeputyHostname("acme.au.deputy.com")).toBe(true);
    expect(isAllowedDeputyHostname("acme.us.deputy.com")).toBe(true);
  });

  it("rejects arbitrary hosts", () => {
    expect(isAllowedDeputyHostname("evil.example.com")).toBe(false);
    expect(isAllowedDeputyHostname("169.254.169.254")).toBe(false);
    expect(() => parseDeputyEndpoint("http://evil.example.com")).toThrow();
  });
});

describe("Deputy OAuth state", () => {
  it("round-trips and rejects expired state", () => {
    const { state, payload } = createDeputyOAuthState({
      organisationId: "org_1",
      actorUserId: "user_1",
    });
    const parsed = parseDeputyOAuthState(state);
    expect(parsed.organisationId).toBe(payload.organisationId);
    expect(parsed.actorUserId).toBe(payload.actorUserId);

    const expired = Buffer.from(
      JSON.stringify({ ...payload, exp: Date.now() - 1000 }),
      "utf8",
    ).toString("base64url");
    expect(() => parseDeputyOAuthState(expired)).toThrow(/expired/i);
  });
});

describe("createUnpublishedDraftRoster", () => {
  beforeEach(() => {
    mappingFindUnique.mockReset();
    mappingUpsert.mockReset();
    deliveryFindUnique.mockReset();
    deliveryCreate.mockReset();
    deliveryUpdate.mockReset();
    process.env.DEPUTY_ENABLED = "true";
    process.env.MAPABLE_INTEGRATIONS_DRY_RUN = "false";
    process.env.MAPABLE_INTEGRATIONS_OUTBOX_ENABLED = "true";
  });

  it("requires employee mapping (no name/email match)", async () => {
    mappingFindUnique
      .mockResolvedValueOnce(null) // care_shift
      .mockResolvedValueOnce(null); // worker
    mappingUpsert.mockResolvedValue({
      syncState: "not_applicable",
      externalId: "not_applicable:w1",
    });

    const result = await createUnpublishedDraftRoster({
      organisationId: "org_1",
      careShiftId: "shift_1",
      workerProfileId: "worker_1",
      startAt: new Date("2026-11-11T22:00:00.000Z"),
      endAt: new Date("2026-11-12T06:00:00.000Z"),
      mealBreakMinutes: 30,
      enqueueOnly: false,
    });

    expect(result.status).toBe("needs_mapping");
    if (result.status === "needs_mapping") {
      expect(result.missing).toBe("employee");
    }
  });

  it("creates unpublished draft with blnPublish false", async () => {
    mappingFindUnique
      .mockResolvedValueOnce(null) // existing care_shift
      .mockResolvedValueOnce({
        externalId: "42",
        syncState: "active",
      }) // employee
      .mockResolvedValueOnce({
        externalId: "7",
        syncState: "active",
      }); // opunit
    deliveryFindUnique.mockResolvedValue(null);
    deliveryCreate.mockResolvedValue({ id: "del_1", state: "pending" });
    deliveryUpdate.mockResolvedValue({});
    mappingUpsert.mockResolvedValue({ externalId: "99" });

    const http = vi.fn(async () => ({
      status: 200,
      bodyText: JSON.stringify({ Id: 99 }),
      json: { Id: 99 },
    }));

    const result = await createUnpublishedDraftRoster(
      {
        organisationId: "org_1",
        careShiftId: "shift_2",
        workerProfileId: "worker_2",
        startAt: new Date("2026-11-11T22:00:00.000Z"),
        endAt: new Date("2026-11-12T06:00:00.000Z"),
        mealBreakMinutes: 15,
      },
      { http },
    );

    expect(result.status).toBe("created");
    expect(http).toHaveBeenCalled();
    const body = JSON.parse(String(http.mock.calls[0][1]?.body));
    expect(body.blnPublish).toBe(false);
    expect(body.blnForceOverwrite).toBe(0);
    expect(body.intRosterEmployee).toBe(42);
    expect(body.intOpunitId).toBe(7);
  });

  it("treats empty 200 as needs_review reconcile (no invented id)", async () => {
    mappingFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ externalId: "42", syncState: "active" })
      .mockResolvedValueOnce({ externalId: "7", syncState: "active" });
    deliveryFindUnique.mockResolvedValue(null);
    deliveryCreate.mockResolvedValue({ id: "del_2", state: "pending" });
    deliveryUpdate.mockResolvedValue({});

    const http = vi.fn(async () => ({
      status: 200,
      bodyText: "",
      json: null,
    }));

    const result = await createUnpublishedDraftRoster(
      {
        organisationId: "org_1",
        careShiftId: "shift_3",
        workerProfileId: "worker_3",
        startAt: new Date("2026-11-11T22:00:00.000Z"),
        endAt: new Date("2026-11-12T06:00:00.000Z"),
      },
      { http },
    );

    expect(result.status).toBe("enqueued");
    expect(deliveryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          state: "needs_review",
          lastErrorClass: "empty_success_body",
        }),
      }),
    );
  });

  it("marks independent workers not_applicable", async () => {
    mappingFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        externalId: "not_applicable:w",
        syncState: "not_applicable",
        metadataJson: { reason: "marketplace independent" },
      });

    const result = await createUnpublishedDraftRoster({
      organisationId: "org_1",
      careShiftId: "shift_4",
      workerProfileId: "worker_4",
      startAt: new Date(),
      endAt: new Date(Date.now() + 3600_000),
    });

    expect(result.status).toBe("not_applicable");
  });
});

describe("Sydney DST", () => {
  it("formats in Australia/Sydney", () => {
    const label = formatSydney(new Date("2026-04-05T01:30:00.000Z"));
    expect(label.length).toBeGreaterThan(0);
  });

  it("detects DST transition spanning AEDT→AEST weekend", () => {
    // 2026-04-05 02:00 Sydney clocks go back (approx).
    const start = new Date("2026-04-04T14:00:00.000Z");
    const end = new Date("2026-04-05T16:00:00.000Z");
    expect(spansSydneyDstTransition(start, end)).toBe(true);
  });
});

describe("Deputy webhooks", () => {
  beforeEach(() => {
    reconCreate.mockResolvedValue({ id: "r1" });
    process.env.DEPUTY_ENABLED = "true";
    process.env.DEPUTY_WEBHOOK_VERIFICATION_MODE = "disabled";
    process.env.MAPABLE_INTEGRATIONS_DRY_RUN = "true";
  });

  it("does not trust unsigned callbacks for mutations", async () => {
    const verified = verifyDeputyWebhookSignature({
      rawBody: "{}",
      signatureHeader: null,
    });
    expect(verified.ok).toBe(false);

    const disposition = await ingestDeputyWebhook({
      organisationId: "org_1",
      rawBody: JSON.stringify({ topic: "Timesheet", id: "55" }),
      signatureHeader: null,
    });
    expect(disposition.action).toBe("hint_refetch");
    expect(reconCreate).toHaveBeenCalled();
  });
});
