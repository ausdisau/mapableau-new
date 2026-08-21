import { ADS_WALLET_CURRENCY } from "@/lib/ads/auction/config";
import type { AdsMicros } from "@/lib/ads/money/micros";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type { AdWalletLedgerType, AdWalletStatus, Prisma } from "@prisma/client";

export async function getOrCreateAdWallet(input: {
  advertiserId: string;
  currency?: string;
  tx?: Prisma.TransactionClient;
}) {
  const db = input.tx ?? prisma;
  const currency = input.currency ?? ADS_WALLET_CURRENCY;
  const existing = await db.adWallet.findUnique({
    where: {
      advertiserId_currency: {
        advertiserId: input.advertiserId,
        currency,
      },
    },
  });
  if (existing) return existing;
  return db.adWallet.create({
    data: {
      advertiserId: input.advertiserId,
      currency,
      availableMicros: 0n,
      status: "ACTIVE",
    },
  });
}

export type ChargeAdvertiserWalletInput = {
  walletId: string;
  campaignId: string;
  advertiserId: string;
  decisionId: string;
  impressionId?: string | null;
  clickId?: string | null;
  bidModel: "CPM" | "CPC";
  clearingPriceMicros: AdsMicros;
  chargedMicros: AdsMicros;
  idempotencyKey: string;
  ledgerType: Extract<
    AdWalletLedgerType,
    "IMPRESSION_CHARGE" | "CLICK_CHARGE"
  >;
};

export type ChargeAdvertiserWalletResult =
  | {
      ok: true;
      billingEventId: string;
      chargedMicros: AdsMicros;
      balanceAfterMicros: AdsMicros;
      duplicate: boolean;
    }
  | {
      ok: false;
      reason:
        | "ALREADY_BILLED"
        | "INSUFFICIENT_WALLET_BALANCE"
        | "DAILY_BUDGET_EXHAUSTED"
        | "LIFETIME_BUDGET_EXHAUSTED"
        | "WALLET_FROZEN"
        | "WALLET_CLOSED"
        | "CAMPAIGN_NOT_FOUND"
        | "INVALID_CHARGE";
    };

/**
 * Atomic prepaid spend. Server-side only.
 * Confirm never billed → budgets → wallet → billable event → ledger → balances.
 */
export async function chargeAdvertiserWallet(
  input: ChargeAdvertiserWalletInput,
): Promise<ChargeAdvertiserWalletResult> {
  if (input.chargedMicros <= 0n) {
    return { ok: false, reason: "INVALID_CHARGE" };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.adBillingEvent.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) {
        if (existing.status === "CHARGED") {
          return {
            ok: true as const,
            billingEventId: existing.id,
            chargedMicros: existing.chargedMicros,
            balanceAfterMicros: 0n,
            duplicate: true,
          };
        }
        return { ok: false as const, reason: "ALREADY_BILLED" as const };
      }

      const wallet = await tx.adWallet.findUnique({
        where: { id: input.walletId },
      });
      if (!wallet) {
        return { ok: false as const, reason: "WALLET_CLOSED" as const };
      }
      if (wallet.status === "FROZEN") {
        return { ok: false as const, reason: "WALLET_FROZEN" as const };
      }
      if (wallet.status === "CLOSED") {
        return { ok: false as const, reason: "WALLET_CLOSED" as const };
      }
      if (wallet.availableMicros < input.chargedMicros) {
        return {
          ok: false as const,
          reason: "INSUFFICIENT_WALLET_BALANCE" as const,
        };
      }

      const campaign = await tx.adCampaign.findUnique({
        where: { id: input.campaignId },
      });
      if (!campaign) {
        return { ok: false as const, reason: "CAMPAIGN_NOT_FOUND" as const };
      }

      const dayKey = new Date().toISOString().slice(0, 10);
      const todaySpend =
        campaign.spendDayKey === dayKey ? campaign.todaySpendMicros : 0n;

      if (
        campaign.dailyBudgetMicros != null &&
        campaign.dailyBudgetMicros > 0n &&
        todaySpend + input.chargedMicros > campaign.dailyBudgetMicros
      ) {
        return {
          ok: false as const,
          reason: "DAILY_BUDGET_EXHAUSTED" as const,
        };
      }
      if (
        campaign.lifetimeBudgetMicros != null &&
        campaign.lifetimeBudgetMicros > 0n &&
        campaign.lifetimeSpendMicros + input.chargedMicros >
          campaign.lifetimeBudgetMicros
      ) {
        return {
          ok: false as const,
          reason: "LIFETIME_BUDGET_EXHAUSTED" as const,
        };
      }

      const balanceAfter = wallet.availableMicros - input.chargedMicros;

      const billing = await tx.adBillingEvent.create({
        data: {
          decisionId: input.decisionId,
          impressionId: input.impressionId ?? null,
          clickId: input.clickId ?? null,
          campaignId: input.campaignId,
          advertiserId: input.advertiserId,
          walletId: input.walletId,
          bidModel: input.bidModel,
          clearingPriceMicros: input.clearingPriceMicros,
          chargedMicros: input.chargedMicros,
          status: "CHARGED",
          idempotencyKey: input.idempotencyKey,
        },
      });

      await tx.adWalletLedgerEntry.create({
        data: {
          walletId: input.walletId,
          type: input.ledgerType,
          amountMicros: -input.chargedMicros,
          balanceAfterMicros: balanceAfter,
          sourceType: "billing_event",
          sourceId: billing.id,
          idempotencyKey: `ledger:${input.idempotencyKey}`,
        },
      });

      await tx.adWallet.update({
        where: { id: input.walletId },
        data: { availableMicros: balanceAfter },
      });

      await tx.adCampaign.update({
        where: { id: input.campaignId },
        data: {
          spendDayKey: dayKey,
          todaySpendMicros: todaySpend + input.chargedMicros,
          lifetimeSpendMicros:
            campaign.lifetimeSpendMicros + input.chargedMicros,
          lifetimeImpressions:
            input.ledgerType === "IMPRESSION_CHARGE"
              ? campaign.lifetimeImpressions + 1n
              : campaign.lifetimeImpressions,
          lifetimeClicks:
            input.ledgerType === "CLICK_CHARGE"
              ? campaign.lifetimeClicks + 1n
              : campaign.lifetimeClicks,
        },
      });

      return {
        ok: true as const,
        billingEventId: billing.id,
        chargedMicros: input.chargedMicros,
        balanceAfterMicros: balanceAfter,
        duplicate: false,
      };
    });
  } catch (err) {
    // Unique constraint race → treat as duplicate success if charged
    const existing = await prisma.adBillingEvent.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing?.status === "CHARGED") {
      return {
        ok: true,
        billingEventId: existing.id,
        chargedMicros: existing.chargedMicros,
        balanceAfterMicros: 0n,
        duplicate: true,
      };
    }
    throw err;
  }
}

export async function creditWalletTopUp(input: {
  walletId: string;
  amountMicros: AdsMicros;
  topUpId: string;
  stripeEventId: string;
  idempotencyKey: string;
}): Promise<{ credited: boolean; duplicate: boolean; balanceAfter: AdsMicros }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.adWalletLedgerEntry.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      return {
        credited: false,
        duplicate: true,
        balanceAfter: existing.balanceAfterMicros ?? 0n,
      };
    }

    const wallet = await tx.adWallet.findUniqueOrThrow({
      where: { id: input.walletId },
    });
    const balanceAfter = wallet.availableMicros + input.amountMicros;

    await tx.adWalletLedgerEntry.create({
      data: {
        walletId: input.walletId,
        type: "TOP_UP",
        amountMicros: input.amountMicros,
        balanceAfterMicros: balanceAfter,
        sourceType: "top_up",
        sourceId: input.topUpId,
        idempotencyKey: input.idempotencyKey,
        stripeEventId: input.stripeEventId,
      },
    });

    await tx.adWallet.update({
      where: { id: input.walletId },
      data: { availableMicros: balanceAfter },
    });

    await tx.adWalletTopUp.update({
      where: { id: input.topUpId },
      data: {
        status: "SUCCEEDED",
        stripeEventId: input.stripeEventId,
        completedAt: new Date(),
      },
    });

    return { credited: true, duplicate: false, balanceAfter };
  });
}

export async function applyTopUpRefund(input: {
  walletId: string;
  topUpId: string;
  amountMicros: AdsMicros;
  stripeEventId: string;
  idempotencyKey: string;
  actorUserId?: string | null;
}): Promise<{ ok: boolean; frozen: boolean; duplicate: boolean }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.adWalletLedgerEntry.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      return { ok: true, frozen: false, duplicate: true };
    }

    const wallet = await tx.adWallet.findUniqueOrThrow({
      where: { id: input.walletId },
    });

    let balanceAfter = wallet.availableMicros - input.amountMicros;
    let status: AdWalletStatus = wallet.status;
    let frozen = false;

    if (balanceAfter < 0n) {
      balanceAfter = 0n;
      status = "FROZEN";
      frozen = true;
      // Pause paid campaigns for this advertiser
      await tx.adCampaign.updateMany({
        where: {
          advertiserId: wallet.advertiserId,
          isHouse: false,
          status: { in: ["ACTIVE", "APPROVED"] },
        },
        data: { status: "PAUSED" },
      });
    }

    await tx.adWalletLedgerEntry.create({
      data: {
        walletId: input.walletId,
        type: "REFUND",
        amountMicros: -input.amountMicros,
        balanceAfterMicros: balanceAfter,
        sourceType: "top_up_refund",
        sourceId: input.topUpId,
        idempotencyKey: input.idempotencyKey,
        stripeEventId: input.stripeEventId,
        metadataJson: frozen
          ? { alert: "REFUND_EXCEEDS_BALANCE_WALLET_FROZEN" }
          : undefined,
      },
    });

    await tx.adWallet.update({
      where: { id: input.walletId },
      data: { availableMicros: balanceAfter, status },
    });

    await tx.adWalletTopUp.update({
      where: { id: input.topUpId },
      data: { status: "REFUNDED" },
    });

    await createAuditEvent({
      actorUserId: input.actorUserId ?? null,
      action: "ads.wallet.topup_refund",
      entityType: "AdWallet",
      entityId: input.walletId,
      metadata: {
        topUpId: input.topUpId,
        frozen,
        stripeEventId: input.stripeEventId,
      },
      tx,
    });

    return { ok: true, frozen, duplicate: false };
  });
}

export async function freezeWalletForDispute(input: {
  walletId: string;
  stripeEventId: string;
  sourceId: string;
  idempotencyKey: string;
  actorUserId?: string | null;
}): Promise<{ duplicate: boolean }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.adWalletLedgerEntry.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return { duplicate: true };

    const wallet = await tx.adWallet.findUniqueOrThrow({
      where: { id: input.walletId },
    });

    await tx.adWalletLedgerEntry.create({
      data: {
        walletId: input.walletId,
        type: "DISPUTE",
        amountMicros: 0n,
        balanceAfterMicros: wallet.availableMicros,
        sourceType: "stripe_dispute",
        sourceId: input.sourceId,
        idempotencyKey: input.idempotencyKey,
        stripeEventId: input.stripeEventId,
        metadataJson: { requiresAdminReview: true },
      },
    });

    await tx.adWallet.update({
      where: { id: input.walletId },
      data: { status: "FROZEN" },
    });

    await tx.adCampaign.updateMany({
      where: {
        advertiserId: wallet.advertiserId,
        isHouse: false,
        status: { in: ["ACTIVE", "APPROVED"] },
      },
      data: { status: "PAUSED" },
    });

    await createAuditEvent({
      actorUserId: input.actorUserId ?? null,
      action: "ads.wallet.dispute_freeze",
      entityType: "AdWallet",
      entityId: input.walletId,
      metadata: { stripeEventId: input.stripeEventId },
      tx,
    });

    return { duplicate: false };
  });
}

export async function manualWalletAdjustment(input: {
  walletId: string;
  amountMicros: AdsMicros;
  type: "MANUAL_CREDIT" | "MANUAL_DEBIT";
  reason: string;
  actorUserId: string;
  idempotencyKey: string;
}): Promise<{ balanceAfter: AdsMicros }> {
  if (!input.reason.trim()) {
    throw new Error("Manual adjustment requires a reason");
  }
  const magnitude =
    input.amountMicros >= 0n ? input.amountMicros : -input.amountMicros;
  if (magnitude === 0n) {
    throw new Error("Adjustment amount must be non-zero");
  }

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.adWallet.findUniqueOrThrow({
      where: { id: input.walletId },
    });
    const delta =
      input.type === "MANUAL_CREDIT" ? magnitude : -magnitude;
    const balanceAfter = wallet.availableMicros + delta;
    if (balanceAfter < 0n) {
      throw new Error("Manual debit would make wallet negative");
    }

    await tx.adWalletLedgerEntry.create({
      data: {
        walletId: input.walletId,
        type: input.type,
        amountMicros: delta,
        balanceAfterMicros: balanceAfter,
        sourceType: "admin_manual",
        sourceId: input.actorUserId,
        idempotencyKey: input.idempotencyKey,
        metadataJson: { reason: input.reason },
      },
    });

    await tx.adWallet.update({
      where: { id: input.walletId },
      data: { availableMicros: balanceAfter },
    });

    await createAuditEvent({
      actorUserId: input.actorUserId,
      action: "ads.wallet.manual_adjustment",
      entityType: "AdWallet",
      entityId: input.walletId,
      metadata: {
        type: input.type,
        amountMicros: delta.toString(),
        reason: input.reason,
      },
      tx,
    });

    return { balanceAfter };
  });
}
