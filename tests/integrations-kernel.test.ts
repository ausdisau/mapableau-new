import { beforeEach, describe, expect, it, vi } from "vitest";

const { deliveryCreate, deliveryFindUnique, deliveryFindMany, deliveryUpdate, deliveryGroupBy, mappingUpsert } =
  vi.hoisted(() => ({
    deliveryCreate: vi.fn(),
    deliveryFindUnique: vi.fn(),
    deliveryFindMany: vi.fn(),
    deliveryUpdate: vi.fn(),
    deliveryGroupBy: vi.fn(),
    mappingUpsert: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    integrationDelivery: {
      create: deliveryCreate,
      findUnique: deliveryFindUnique,
      findMany: deliveryFindMany,
      update: deliveryUpdate,
      groupBy: deliveryGroupBy,
    },
    integrationExternalMapping: {
      upsert: mappingUpsert,
    },
  },
}));

import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";
import {
  encryptIntegrationSecret,
  decryptIntegrationSecret,
} from "@/lib/crypto/integration-secrets";
import {
  enqueueIntegrationDelivery,
  processPendingDeliveries,
} from "@/lib/integrations/delivery/outbox-service";
import { upsertExternalMapping } from "@/lib/integrations/delivery/mapping-service";

describe("integrations feature flags", () => {
  it("defaults outbox off and dry-run on", () => {
    delete process.env.MAPABLE_INTEGRATIONS_OUTBOX_ENABLED;
    delete process.env.MAPABLE_INTEGRATIONS_DRY_RUN;
    delete process.env.DEPUTY_ENABLED;
    delete process.env.XERO_DIRECT_ENABLED;
    delete process.env.STRIPE_DIRECT_BOOKING_ENABLED;
    expect(integrationsFeatureFlags.outboxEnabled()).toBe(false);
    expect(integrationsFeatureFlags.dryRun()).toBe(true);
    expect(integrationsFeatureFlags.deputyEnabled()).toBe(false);
    expect(integrationsFeatureFlags.xeroDirectEnabled()).toBe(false);
    expect(integrationsFeatureFlags.stripeDirectBookingEnabled()).toBe(false);
  });
});

describe("integration secret encryption", () => {
  it("round-trips token JSON", () => {
    const cipher = encryptIntegrationSecret(
      JSON.stringify({ accessToken: "at", refreshToken: "rt" }),
    );
    expect(cipher).not.toContain("at");
    const plain = decryptIntegrationSecret(cipher);
    expect(JSON.parse(plain!)).toEqual({
      accessToken: "at",
      refreshToken: "rt",
    });
  });
});

describe("integration outbox", () => {
  beforeEach(() => {
    deliveryCreate.mockReset();
    deliveryFindUnique.mockReset();
    deliveryFindMany.mockReset();
    deliveryUpdate.mockReset();
    process.env.MAPABLE_INTEGRATIONS_OUTBOX_ENABLED = "true";
    process.env.MAPABLE_INTEGRATIONS_DRY_RUN = "true";
  });

  it("dedupes by dedupeKey", async () => {
    deliveryFindUnique.mockResolvedValue({
      id: "existing",
      dedupeKey: "deputy:shift:1:create",
    });
    const result = await enqueueIntegrationDelivery({
      eventId: "evt_1",
      aggregateType: "care_shift",
      aggregateId: "shift_1",
      aggregateRevision: 1,
      provider: "deputy",
      organisationId: "org_1",
      dedupeKey: "deputy:shift:1:create",
    });
    expect(result.created).toBe(false);
    expect(deliveryCreate).not.toHaveBeenCalled();
  });

  it("creates pending delivery when new", async () => {
    deliveryFindUnique.mockResolvedValue(null);
    deliveryCreate.mockResolvedValue({
      id: "new",
      state: "pending",
      dedupeKey: "deputy:shift:2:create",
    });
    const result = await enqueueIntegrationDelivery({
      eventId: "evt_2",
      aggregateType: "care_shift",
      aggregateId: "shift_2",
      aggregateRevision: 1,
      provider: "deputy",
      organisationId: "org_1",
      dedupeKey: "deputy:shift:2:create",
      payloadRef: { careShiftId: "shift_2" },
    });
    expect(result.created).toBe(true);
    expect(deliveryCreate).toHaveBeenCalled();
  });

  it("dry-run process marks delivered without remote side effects", async () => {
    deliveryFindMany.mockResolvedValue([
      {
        id: "d1",
        attemptCount: 0,
        state: "pending",
      },
    ]);
    deliveryUpdate.mockResolvedValue({});
    const handler = vi.fn(async () => ({ ok: true }));
    const summary = await processPendingDeliveries(handler);
    expect(summary.delivered).toBe(1);
    expect(handler).not.toHaveBeenCalled();
    expect(deliveryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          state: "delivered",
          lastErrorMessage: "dry_run",
        }),
      }),
    );
  });
});

describe("external mapping", () => {
  it("upserts worker to deputy employee mapping", async () => {
    mappingUpsert.mockResolvedValue({
      id: "m1",
      internalId: "worker_1",
      externalId: "99",
    });
    const row = await upsertExternalMapping({
      organisationId: "org_1",
      provider: "deputy",
      internalType: "worker_profile",
      internalId: "worker_1",
      externalId: "99",
    });
    expect(row.externalId).toBe("99");
    expect(mappingUpsert).toHaveBeenCalled();
  });
});
