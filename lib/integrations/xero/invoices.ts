import { z } from "zod";

import {
  findExternalMapping,
  upsertExternalMapping,
} from "@/lib/integrations/delivery/mapping-service";
import { enqueueIntegrationDelivery } from "@/lib/integrations/delivery/outbox-service";
import { readConnectionTokens } from "@/lib/integrations/delivery/connection-tokens";
import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";
import {
  getXeroDirectConfig,
  readOrgXeroAccountingConfig,
} from "@/lib/integrations/xero/config";
import { refreshXeroAccessToken } from "@/lib/integrations/xero/oauth";
import { prisma } from "@/lib/prisma";

export const createDraftAccRecInputSchema = z.object({
  organisationId: z.string(),
  billingInvoiceId: z.string(),
  contactId: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(1).max(4000),
        quantity: z.number().positive(),
        unitAmount: z.number(), // major currency units for Xero API
        accountCode: z.string().optional(),
        itemCode: z.string().optional(),
        taxType: z.string().optional(),
      }),
    )
    .min(1),
  reference: z.string().max(255).optional(),
  idempotencyKey: z.string().min(1),
});

export type CreateDraftAccRecInput = z.infer<typeof createDraftAccRecInputSchema>;

export type CreateDraftAccRecResult =
  | {
      ok: true;
      live: boolean;
      xeroInvoiceId?: string;
      status: "DRAFT";
      duplicate?: boolean;
      dryRun?: boolean;
      message: string;
    }
  | {
      ok: false;
      live: false;
      code:
        | "disabled"
        | "missing_accounting_config"
        | "missing_contact"
        | "not_connected"
        | "rate_limited"
        | "remote_error";
      message: string;
      retryAfterSeconds?: number;
    };

export type XeroHttp = (
  path: string,
  init: RequestInit & { organisationId: string; tenantId: string },
) => Promise<{ status: number; json: unknown; headers: Headers }>;

async function defaultXeroHttp(
  path: string,
  init: RequestInit & { organisationId: string; tenantId: string },
) {
  const cfg = getXeroDirectConfig();
  const connection = await prisma.billingIntegrationConnection.findUnique({
    where: {
      organisationId_provider: {
        organisationId: init.organisationId,
        provider: "xero",
      },
    },
  });
  if (!connection) throw new Error("Xero not connected");
  let tokens = readConnectionTokens(connection);
  if (!tokens?.accessToken) throw new Error("Xero tokens missing");

  const expiresAt = tokens.expiresAt ? new Date(tokens.expiresAt).getTime() : 0;
  if (expiresAt && expiresAt < Date.now() + 60_000) {
    const refreshed = await refreshXeroAccessToken(init.organisationId);
    tokens = {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
    };
  }

  const { organisationId: _o, tenantId, ...req } = init;
  const res = await fetch(`${cfg.apiBase}${path}`, {
    ...req,
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "xero-tenant-id": tenantId,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(req.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json, headers: res.headers };
}

/**
 * Create Xero ACCREC DRAFT only. Never authorises/sends.
 * Requires per-org AccountCode/TaxType (and Contact) configuration.
 */
export async function createDraftAccRecInvoice(
  input: CreateDraftAccRecInput,
  deps: { http?: XeroHttp } = {},
): Promise<CreateDraftAccRecResult> {
  const parsed = createDraftAccRecInputSchema.parse(input);

  if (!integrationsFeatureFlags.xeroDirectEnabled()) {
    return {
      ok: false,
      live: false,
      code: "disabled",
      message: "XERO_DIRECT_ENABLED is false; placeholders remain",
    };
  }

  const existing = await findExternalMapping({
    organisationId: parsed.organisationId,
    provider: "xero",
    internalType: "billing_invoice",
    internalId: parsed.billingInvoiceId,
  });
  if (existing?.syncState === "active") {
    return {
      ok: true,
      live: true,
      xeroInvoiceId: existing.externalId,
      status: "DRAFT",
      duplicate: true,
      message: "Xero invoice already mapped for this billing invoice",
    };
  }

  const connection = await prisma.billingIntegrationConnection.findUnique({
    where: {
      organisationId_provider: {
        organisationId: parsed.organisationId,
        provider: "xero",
      },
    },
  });
  if (!connection?.externalTenantId || connection.status !== "connected") {
    return {
      ok: false,
      live: false,
      code: "not_connected",
      message: "Organisation has no connected Xero tenant",
    };
  }

  const accounting = readOrgXeroAccountingConfig(connection.configJson);
  if (!accounting) {
    return {
      ok: false,
      live: false,
      code: "missing_accounting_config",
      message:
        "Per-organisation AccountCode and TaxType are required; do not invent chart-of-accounts values",
    };
  }

  const contactId = parsed.contactId ?? accounting.contactId;
  if (!contactId) {
    return {
      ok: false,
      live: false,
      code: "missing_contact",
      message: "Xero Contact ID mapping is required for the liable party",
    };
  }

  await enqueueIntegrationDelivery({
    eventId: parsed.idempotencyKey,
    aggregateType: "billing_invoice",
    aggregateId: parsed.billingInvoiceId,
    aggregateRevision: 1,
    provider: "xero",
    organisationId: parsed.organisationId,
    externalTenantId: connection.externalTenantId,
    dedupeKey: `xero:invoice:${parsed.billingInvoiceId}:${parsed.idempotencyKey}`,
    payloadRef: { billingInvoiceId: parsed.billingInvoiceId },
  });

  if (integrationsFeatureFlags.dryRun()) {
    return {
      ok: true,
      live: false,
      status: "DRAFT",
      dryRun: true,
      message: "Dry-run: would create Xero ACCREC DRAFT",
    };
  }

  const http = deps.http ?? defaultXeroHttp;
  const body = {
    Invoices: [
      {
        Type: "ACCREC",
        Status: "DRAFT",
        Contact: { ContactID: contactId },
        LineItems: parsed.lineItems.map((line) => ({
          Description: line.description,
          Quantity: line.quantity,
          UnitAmount: line.unitAmount,
          AccountCode: line.accountCode ?? accounting.accountCode,
          ItemCode: line.itemCode ?? accounting.itemCode,
          TaxType: line.taxType ?? accounting.taxType,
        })),
        Reference: parsed.reference ?? parsed.billingInvoiceId,
        CurrencyCode: accounting.currency,
      },
    ],
  };

  const res = await http("/Invoices", {
    method: "POST",
    organisationId: parsed.organisationId,
    tenantId: connection.externalTenantId,
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After") ?? "60");
    return {
      ok: false,
      live: false,
      code: "rate_limited",
      message: "Xero rate limit; respect Retry-After",
      retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : 60,
    };
  }

  if (res.status < 200 || res.status >= 300) {
    return {
      ok: false,
      live: false,
      code: "remote_error",
      message: `Xero invoice create failed: HTTP ${res.status}`,
    };
  }

  const invoiceId = extractXeroInvoiceId(res.json);
  if (!invoiceId) {
    return {
      ok: false,
      live: false,
      code: "remote_error",
      message:
        "Xero response ambiguous; reconcile by internal reference before retrying",
    };
  }

  await upsertExternalMapping({
    organisationId: parsed.organisationId,
    provider: "xero",
    internalType: "billing_invoice",
    internalId: parsed.billingInvoiceId,
    externalId: invoiceId,
    syncState: "active",
    metadataJson: { status: "DRAFT", type: "ACCREC" },
  });

  await prisma.billingInvoice.update({
    where: { id: parsed.billingInvoiceId },
    data: {
      xeroInvoiceId: invoiceId,
      xeroExportStatus: "draft_exported",
    },
  });

  return {
    ok: true,
    live: true,
    xeroInvoiceId: invoiceId,
    status: "DRAFT",
    message: "Xero ACCREC DRAFT created (not authorised/sent)",
  };
}

function extractXeroInvoiceId(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const invoices = (json as { Invoices?: Array<{ InvoiceID?: string }> }).Invoices;
  const id = invoices?.[0]?.InvoiceID;
  return id ?? null;
}
