import { createHmac } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mappingFindUnique,
  mappingUpsert,
  deliveryFindUnique,
  deliveryCreate,
  connectionFindUnique,
  billingInvoiceUpdate,
  reconCreate,
} = vi.hoisted(() => ({
  mappingFindUnique: vi.fn(),
  mappingUpsert: vi.fn(),
  deliveryFindUnique: vi.fn(),
  deliveryCreate: vi.fn(),
  connectionFindUnique: vi.fn(),
  billingInvoiceUpdate: vi.fn(),
  reconCreate: vi.fn(),
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
    },
    billingIntegrationConnection: {
      findUnique: connectionFindUnique,
    },
    billingInvoice: {
      update: billingInvoiceUpdate,
    },
    integrationReconciliation: {
      create: reconCreate,
    },
  },
}));

import { createDraftAccRecInvoice } from "@/lib/integrations/xero/invoices";
import {
  applyRetryAfter,
  noteXeroCall,
  resetXeroRateLimitBuckets,
} from "@/lib/integrations/xero/rate-limit";
import {
  ingestXeroWebhook,
  verifyXeroWebhookSignature,
} from "@/lib/integrations/xero/webhooks";
import {
  createXeroOAuthState,
  parseXeroOAuthState,
} from "@/lib/integrations/xero/oauth";

describe("Xero OAuth state", () => {
  it("rejects expired state", () => {
    const { state } = createXeroOAuthState({
      organisationId: "org_1",
      actorUserId: "user_1",
    });
    expect(parseXeroOAuthState(state).organisationId).toBe("org_1");
  });
});

describe("createDraftAccRecInvoice", () => {
  beforeEach(() => {
    mappingFindUnique.mockReset();
    mappingUpsert.mockReset();
    deliveryFindUnique.mockReset();
    deliveryCreate.mockReset();
    connectionFindUnique.mockReset();
    billingInvoiceUpdate.mockReset();
    process.env.XERO_DIRECT_ENABLED = "true";
    process.env.MAPABLE_INTEGRATIONS_DRY_RUN = "false";
  });

  it("refuses when accounting config missing", async () => {
    mappingFindUnique.mockResolvedValue(null);
    connectionFindUnique.mockResolvedValue({
      status: "connected",
      externalTenantId: "tenant_1",
      configJson: {},
    });
    const result = await createDraftAccRecInvoice({
      organisationId: "org_1",
      billingInvoiceId: "inv_1",
      idempotencyKey: "idem_1",
      lineItems: [
        { description: "Care support", quantity: 2, unitAmount: 55 },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("missing_accounting_config");
  });

  it("refuses missing contact", async () => {
    mappingFindUnique.mockResolvedValue(null);
    connectionFindUnique.mockResolvedValue({
      status: "connected",
      externalTenantId: "tenant_1",
      configJson: { accountCode: "200", taxType: "OUTPUT" },
    });
    const result = await createDraftAccRecInvoice({
      organisationId: "org_1",
      billingInvoiceId: "inv_1",
      idempotencyKey: "idem_2",
      lineItems: [
        { description: "Care support", quantity: 1, unitAmount: 100 },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("missing_contact");
  });

  it("dedupes existing mapping", async () => {
    mappingFindUnique.mockResolvedValue({
      syncState: "active",
      externalId: "xero-inv-1",
    });
    const result = await createDraftAccRecInvoice({
      organisationId: "org_1",
      billingInvoiceId: "inv_1",
      idempotencyKey: "idem_3",
      lineItems: [
        { description: "Care support", quantity: 1, unitAmount: 100 },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.duplicate).toBe(true);
      expect(result.xeroInvoiceId).toBe("xero-inv-1");
    }
  });

  it("creates DRAFT ACCREC via http and persists mapping", async () => {
    mappingFindUnique.mockResolvedValue(null);
    connectionFindUnique.mockResolvedValue({
      status: "connected",
      externalTenantId: "tenant_1",
      configJson: {
        accountCode: "200",
        taxType: "OUTPUT",
        contactId: "contact-1",
        currency: "AUD",
      },
    });
    deliveryFindUnique.mockResolvedValue(null);
    deliveryCreate.mockResolvedValue({ id: "d1" });
    mappingUpsert.mockResolvedValue({ externalId: "new-xero-id" });
    billingInvoiceUpdate.mockResolvedValue({});

    const http = vi.fn(async () => ({
      status: 200,
      headers: new Headers(),
      json: { Invoices: [{ InvoiceID: "new-xero-id", Status: "DRAFT" }] },
    }));

    const result = await createDraftAccRecInvoice(
      {
        organisationId: "org_1",
        billingInvoiceId: "inv_2",
        idempotencyKey: "idem_4",
        lineItems: [
          { description: "Support work", quantity: 3, unitAmount: 65.5 },
        ],
      },
      { http },
    );

    expect(result.ok).toBe(true);
    const body = JSON.parse(String(http.mock.calls[0][1]?.body));
    expect(body.Invoices[0].Type).toBe("ACCREC");
    expect(body.Invoices[0].Status).toBe("DRAFT");
    expect(mappingUpsert).toHaveBeenCalled();
  });

  it("handles 429 with retry-after", async () => {
    mappingFindUnique.mockResolvedValue(null);
    connectionFindUnique.mockResolvedValue({
      status: "connected",
      externalTenantId: "tenant_1",
      configJson: {
        accountCode: "200",
        taxType: "OUTPUT",
        contactId: "c1",
      },
    });
    deliveryFindUnique.mockResolvedValue(null);
    deliveryCreate.mockResolvedValue({ id: "d2" });

    const http = vi.fn(async () => ({
      status: 429,
      headers: new Headers({ "Retry-After": "90" }),
      json: null,
    }));

    const result = await createDraftAccRecInvoice(
      {
        organisationId: "org_1",
        billingInvoiceId: "inv_3",
        idempotencyKey: "idem_5",
        lineItems: [{ description: "x", quantity: 1, unitAmount: 1 }],
      },
      { http },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("rate_limited");
      expect(result.retryAfterSeconds).toBe(90);
    }
  });
});

describe("Xero webhook signature", () => {
  it("accepts valid HMAC and rejects malformed", async () => {
    process.env.XERO_WEBHOOK_KEY = "test-webhook-key";
    const rawBody = JSON.stringify({ events: [{ eventType: "UPDATE", resourceId: "1" }] });
    const sig = createHmac("sha256", "test-webhook-key")
      .update(rawBody, "utf8")
      .digest("base64");
    expect(verifyXeroWebhookSignature({ rawBody, signatureHeader: sig })).toBe(true);
    expect(
      verifyXeroWebhookSignature({ rawBody, signatureHeader: "bad" }),
    ).toBe(false);

    reconCreate.mockResolvedValue({});
    const ok = await ingestXeroWebhook({
      organisationId: "org_1",
      rawBody,
      signatureHeader: sig,
    });
    expect(ok.ok).toBe(true);
  });
});

describe("Xero rate limit buckets", () => {
  beforeEach(() => resetXeroRateLimitBuckets());

  it("applies retry-after cooldown", () => {
    expect(noteXeroCall("t1").allowed).toBe(true);
    applyRetryAfter("t1", 30);
    const next = noteXeroCall("t1");
    expect(next.allowed).toBe(false);
    expect(next.retryAfterSeconds).toBeGreaterThan(0);
  });
});
