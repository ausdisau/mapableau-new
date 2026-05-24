import { getCampaignForOrgUser } from "@/lib/ads/access";
import { getAdsCampaignPackageCents } from "@/lib/ads/config";
import { validateCampaignForSubmit } from "@/lib/ads/policy-validation";
import type { CurrentUser } from "@/lib/auth/current-user";
import { createCheckoutForInvoice } from "@/lib/billing-core/checkout-service";
import { createDraftInvoice } from "@/lib/billing-core/invoice-service";
import { prisma } from "@/lib/prisma";

export async function submitCampaignForPayment(
  user: CurrentUser,
  campaignId: string
) {
  const campaign = await getCampaignForOrgUser(campaignId, user.id);
  if (!campaign) return { ok: false as const, error: "Campaign not found." };
  if (campaign.status !== "draft" && campaign.status !== "rejected") {
    return {
      ok: false as const,
      error: "Campaign cannot be submitted in its current status.",
    };
  }

  const policy = validateCampaignForSubmit({
    name: campaign.name,
    creatives: campaign.creatives,
    targeting: campaign.targeting,
    category: campaign.advertiser.category,
  });
  if (!policy.passed) {
    return { ok: false as const, error: policy.violations.join(" ") };
  }

  const packageCents = campaign.budgetCents || getAdsCampaignPackageCents();

  const invoice = await createDraftInvoice(user.id, {
    providerId: campaign.advertiser.organisationId,
    serviceType: "advertising",
    lineItems: [
      {
        description: `MapAble Ads — ${campaign.name}`,
        quantity: 1,
        unitAmountCents: packageCents,
        gstApplicable: true,
        metadata: { adCampaignId: campaign.id },
      },
    ],
  });

  await prisma.billingInvoice.update({
    where: { id: invoice.id },
    data: { status: "issued" },
  });

  const updated = await prisma.adCampaign.update({
    where: { id: campaignId },
    data: {
      status: "pending_payment",
      billingInvoiceId: invoice.id,
      budgetCents: packageCents,
      submittedAt: new Date(),
    },
    include: { billingInvoice: true, creatives: true },
  });

  return { ok: true as const, campaign: updated, invoiceId: invoice.id };
}

export async function createCampaignCheckout(
  user: CurrentUser,
  campaignId: string
) {
  const campaign = await getCampaignForOrgUser(campaignId, user.id);
  if (!campaign) return { ok: false as const, error: "Campaign not found." };
  if (!campaign.billingInvoiceId) {
    return { ok: false as const, error: "Submit the campaign before checkout." };
  }
  if (campaign.status !== "pending_payment") {
    return {
      ok: false as const,
      error: "Campaign is not awaiting payment.",
    };
  }

  const funding = campaign.billingInvoice?.fundingSource?.type;
  if (funding === "ndis_plan_managed") {
    return {
      ok: false as const,
      error:
        "NDIS plan-managed funding cannot be used for advertising. Use a private card or organisation invoice.",
    };
  }

  const result = await createCheckoutForInvoice(
    user.id,
    campaign.billingInvoiceId
  );
  if (!result.ok) {
    return { ok: false as const, error: result.error ?? "Checkout failed" };
  }

  return {
    ok: true as const,
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId,
  };
}

export async function handleAdInvoicePaid(invoiceId: string) {
  const campaign = await prisma.adCampaign.findFirst({
    where: { billingInvoiceId: invoiceId },
  });
  if (!campaign) return;

  if (campaign.status === "pending_payment") {
    await prisma.adCampaign.update({
      where: { id: campaign.id },
      data: { status: "pending_review" },
    });
  }
}
