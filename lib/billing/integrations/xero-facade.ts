import { randomUUID } from "crypto";

import type { MapAbleUserRole } from "@prisma/client";

import { writeFinancialAudit } from "@/lib/billing/audit/financial-audit";
import { isXeroConfigured } from "@/lib/config/phase2";
import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";
import { createDraftAccRecInvoice } from "@/lib/integrations/xero/invoices";
import { buildXeroAuthorizeUrl, createXeroOAuthState } from "@/lib/integrations/xero/oauth";
import { prisma } from "@/lib/prisma";
import {
  getXeroOAuthStartUrl,
  getXeroSyncStatus,
  syncInvoiceToXeroPlaceholder,
  xeroNotConfiguredResponse,
} from "@/lib/xero/xero-service";

export type XeroConnectResult =
  | {
      ok: true;
      live: false;
      configured: boolean;
      url?: string;
      message: string;
      connectionId?: string;
    }
  | {
      ok: false;
      live: false;
      configured: false;
      message: string;
    };

/**
 * Facade over lib/xero. Never claims a live sync unless Xero credentials are configured.
 * Even when configured, Phase 2 sync remains a placeholder (not production-live).
 */
export async function connectXero(input: {
  organisationId?: string | null;
  actorId?: string | null;
  actorRole?: MapAbleUserRole | string | null;
}): Promise<XeroConnectResult> {
  // Prefer direct OAuth when XERO_DIRECT_ENABLED; otherwise legacy placeholder URL.
  if (
    integrationsFeatureFlags.xeroDirectEnabled() &&
    input.organisationId &&
    input.actorId
  ) {
    try {
      const { state } = createXeroOAuthState({
        organisationId: input.organisationId,
        actorUserId: input.actorId,
      });
      const url = buildXeroAuthorizeUrl(state);
      const connection = await prisma.billingIntegrationConnection.upsert({
        where: {
          organisationId_provider: {
            organisationId: input.organisationId,
            provider: "xero",
          },
        },
        create: {
          organisationId: input.organisationId,
          provider: "xero",
          status: "connecting",
          connectedById: input.actorId,
        },
        update: { status: "connecting", lastError: null },
      });
      await writeFinancialAudit({
        organisationId: input.organisationId,
        actorId: input.actorId,
        actorRole: input.actorRole,
        action: "xero_direct_connect_started",
        entityType: "BillingIntegrationConnection",
        entityId: connection.id,
        newValues: { live: false, mode: "authorization_code" },
      });
      return {
        ok: true,
        live: false,
        configured: true,
        url,
        connectionId: connection.id,
        message:
          "Xero direct OAuth start URL prepared. Invoices remain DRAFT-only until accountant review.",
      };
    } catch (err) {
      return {
        ok: false,
        live: false,
        configured: false,
        message: err instanceof Error ? err.message : "Xero direct connect failed",
      };
    }
  }

  const start = getXeroOAuthStartUrl();
  const configured = isXeroConfigured();

  if (!configured || !start.ok) {
    return {
      ok: false,
      live: false,
      configured: false,
      message:
        xeroNotConfiguredResponse().message +
        " — Xero connect is a stub until credentials are configured.",
    };
  }

  const existing = input.organisationId
    ? await prisma.billingIntegrationConnection.findUnique({
        where: {
          organisationId_provider: {
            organisationId: input.organisationId,
            provider: "xero",
          },
        },
      })
    : await prisma.billingIntegrationConnection.findFirst({
        where: { organisationId: null, provider: "xero" },
      });

  const connection = existing
    ? await prisma.billingIntegrationConnection.update({
        where: { id: existing.id },
        data: { status: "connecting", lastError: null },
      })
    : await prisma.billingIntegrationConnection.create({
        data: {
          organisationId: input.organisationId ?? undefined,
          provider: "xero",
          status: "connecting",
          configJson: { simulated: !configured, phase: "oauth_stub" },
        },
      });

  await writeFinancialAudit({
    organisationId: input.organisationId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "xero_connect_started",
    entityType: "BillingIntegrationConnection",
    entityId: connection.id,
    newValues: { configured, live: false },
  });

  return {
    ok: true,
    live: false,
    configured: true,
    url: start.url,
    connectionId: connection.id,
    message:
      "Xero OAuth start URL prepared. Sync remains non-live until a production Xero integration is enabled.",
  };
}

export type SyncInvoiceToXeroInput = {
  invoiceId: string;
  organisationId?: string | null;
  actorId?: string | null;
  actorRole?: MapAbleUserRole | string | null;
  /** Idempotency key — retries with the same key reuse the prior attempt ref. */
  idempotencyKey?: string;
};

export type SyncInvoiceToXeroResult = {
  ok: boolean;
  /** True only when a real Xero DRAFT was created under XERO_DIRECT_ENABLED. */
  live: boolean;
  configured: boolean;
  idempotencyRef: string;
  message: string;
  recordId?: string;
};

/**
 * Idempotent Xero sync. Uses direct DRAFT ACCREC when XERO_DIRECT_ENABLED;
 * otherwise the historical non-live stub. Never auto-authorises/sends invoices.
 */
export async function syncInvoiceToXero(
  input: SyncInvoiceToXeroInput
): Promise<SyncInvoiceToXeroResult> {
  const configured = isXeroConfigured() || integrationsFeatureFlags.xeroDirectEnabled();
  const idempotencyRef =
    input.idempotencyKey ?? `xero-sync:${input.invoiceId}:${randomUUID()}`;

  const existingConnection = input.organisationId
    ? await prisma.billingIntegrationConnection.findUnique({
        where: {
          organisationId_provider: {
            organisationId: input.organisationId,
            provider: "xero",
          },
        },
      })
    : null;

  if (
    integrationsFeatureFlags.xeroDirectEnabled() &&
    input.organisationId &&
    existingConnection?.status === "connected"
  ) {
    const invoice = await prisma.billingInvoice.findUnique({
      where: { id: input.invoiceId },
      include: { lineItems: true },
    });
    if (invoice?.lineItems.length) {
      const direct = await createDraftAccRecInvoice({
        organisationId: input.organisationId,
        billingInvoiceId: invoice.id,
        idempotencyKey: idempotencyRef,
        reference: invoice.invoiceNumber ?? invoice.id,
        lineItems: invoice.lineItems.map((line) => ({
          description: line.description,
          quantity: Number(line.quantity),
          unitAmount: line.unitAmountCents / 100,
        })),
      });
      await writeFinancialAudit({
        organisationId: input.organisationId,
        actorId: input.actorId,
        actorRole: input.actorRole,
        action: direct.ok ? "xero_direct_draft_export" : "xero_direct_draft_failed",
        entityType: "BillingInvoice",
        entityId: input.invoiceId,
        newValues: { idempotencyRef, ...direct },
      });
      return {
        ok: direct.ok,
        live: Boolean(direct.ok && "live" in direct && direct.live),
        configured: true,
        idempotencyRef,
        recordId: direct.ok ? direct.xeroInvoiceId : undefined,
        message: direct.message,
      };
    }
  }

  if (!configured) {
    await writeFinancialAudit({
      organisationId: input.organisationId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: "xero_sync_skipped_not_configured",
      entityType: "BillingInvoice",
      entityId: input.invoiceId,
      newValues: { idempotencyRef, live: false, configured: false },
    });

    return {
      ok: false,
      live: false,
      configured: false,
      idempotencyRef,
      message:
        "Xero is not configured. No live sync was attempted. Configure credentials before enabling export.",
    };
  }

  // Prefer billing invoice xero fields; fall back to legacy placeholder for compatibility
  const billingInvoice = await prisma.billingInvoice.findUnique({
    where: { id: input.invoiceId },
  });

  if (billingInvoice) {
    if (
      billingInvoice.xeroInvoiceId &&
      billingInvoice.xeroExportStatus === "synced"
    ) {
      return {
        ok: true,
        live: false,
        configured: true,
        idempotencyRef: billingInvoice.xeroInvoiceId,
        message:
          "Idempotent hit: invoice already has a Xero export reference (non-live stub).",
        recordId: billingInvoice.xeroInvoiceId,
      };
    }

    const stubExternalId = `XERO-STUB-${idempotencyRef.slice(0, 24)}`;
    await prisma.billingInvoice.update({
      where: { id: input.invoiceId },
      data: {
        xeroExportStatus: "pending_stub",
        xeroInvoiceId: stubExternalId,
      },
    });

    if (existingConnection) {
      await prisma.billingIntegrationConnection.update({
        where: { id: existingConnection.id },
        data: {
          lastSyncAt: new Date(),
          status: "connected_stub",
          lastError: "Full Xero sync not implemented — stub only",
        },
      });
    }

    await writeFinancialAudit({
      organisationId: input.organisationId ?? billingInvoice.providerId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: "xero_sync_stub",
      entityType: "BillingInvoice",
      entityId: input.invoiceId,
      newValues: {
        idempotencyRef,
        stubExternalId,
        live: false,
        configured: true,
      },
    });

    return {
      ok: true,
      live: false,
      configured: true,
      idempotencyRef,
      recordId: stubExternalId,
      message:
        "Xero sync stub recorded with idempotency ref. This is not a live Xero export.",
    };
  }

  // Legacy Invoice path (placeholder)
  const legacy = await syncInvoiceToXeroPlaceholder(input.invoiceId);
  await writeFinancialAudit({
    organisationId: input.organisationId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "xero_sync_legacy_placeholder",
    entityType: "Invoice",
    entityId: input.invoiceId,
    newValues: { idempotencyRef, live: false, ok: legacy.ok },
  });

  return {
    ok: legacy.ok,
    live: false,
    configured: true,
    idempotencyRef,
    recordId: legacy.ok ? legacy.record.id : undefined,
    message: legacy.ok
      ? "Legacy Xero placeholder sync queued (non-live)."
      : legacy.message ?? "Xero sync failed",
  };
}

export async function getBillingXeroStatus(invoiceId: string) {
  const billing = await prisma.billingInvoice.findUnique({
    where: { id: invoiceId },
    select: { xeroExportStatus: true, xeroInvoiceId: true },
  });
  if (billing) {
    const direct = integrationsFeatureFlags.xeroDirectEnabled();
    return {
      configured: isXeroConfigured() || direct,
      live: Boolean(direct && billing.xeroExportStatus === "draft_exported"),
      status: billing.xeroExportStatus ?? "not_started",
      externalId: billing.xeroInvoiceId,
      directEnabled: direct,
      autoAuthorise: false as const,
    };
  }
  const legacy = await getXeroSyncStatus(invoiceId);
  return { ...legacy, live: false as const, autoAuthorise: false as const };
}
