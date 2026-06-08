import type { BillingServiceType } from "@prisma/client";

import { getOrCreateBillingAccount } from "@/lib/billing-core/account-service";
import { writeBillingAuditLog } from "@/lib/billing-core/audit";
import {
  billingCoreConfig,
  isBillingStripeConfigured,
} from "@/lib/billing-core/config";
import { createDraftInvoice } from "@/lib/billing-core/invoice-service";
import { createCheckoutForInvoice } from "@/lib/billing-core/checkout-service";
import { prisma } from "@/lib/prisma";

export type EnrollmentProduct =
  | "provider_academy"
  | "partner_api_program"
  | "access_accreditation";

const ENROLLMENT_PRODUCTS: Record<
  EnrollmentProduct,
  { label: string; serviceType: BillingServiceType; amountCents: number }
> = {
  provider_academy: {
    label: "MapAble Provider Academy enrollment",
    serviceType: "other",
    amountCents: 9900,
  },
  partner_api_program: {
    label: "MapAble Partner API program",
    serviceType: "other",
    amountCents: 49900,
  },
  access_accreditation: {
    label: "MapAble Access accreditation assessment",
    serviceType: "other",
    amountCents: 29900,
  },
};

export function enrollmentProductConfig(product: EnrollmentProduct) {
  return ENROLLMENT_PRODUCTS[product];
}

export async function createEnrollmentCheckout(params: {
  userId: string;
  product: EnrollmentProduct;
  referenceId?: string;
  organisationId?: string;
}) {
  if (!isBillingStripeConfigured()) {
    return { ok: false as const, error: "Stripe is not configured" };
  }

  const product = enrollmentProductConfig(params.product);
  await getOrCreateBillingAccount(params.userId, "participant");

  const invoice = await createDraftInvoice(params.userId, {
    providerId: params.organisationId,
    serviceType: product.serviceType,
    lineItems: [
      {
        description: product.label,
        quantity: 1,
        unitAmountCents: product.amountCents,
        gstApplicable: true,
        metadata: {
          enrollmentProduct: params.product,
          referenceId: params.referenceId,
        },
      },
    ],
  });

  const checkout = await createCheckoutForInvoice(params.userId, invoice.id);
  if (!checkout.ok) {
    return checkout;
  }

  await writeBillingAuditLog({
    actorUserId: params.userId,
    entityType: "BillingInvoice",
    entityId: invoice.id,
    action: "enrollment_checkout_started",
    after: { product: params.product, referenceId: params.referenceId },
  });

  return {
    ok: true as const,
    checkoutUrl: checkout.checkoutUrl,
    invoiceId: invoice.id,
    successUrl: `${billingCoreConfig.appUrl}/dashboard/billing?enrollment=success`,
  };
}

export async function markEnrollmentPaid(params: {
  userId: string;
  product: EnrollmentProduct;
  referenceId?: string;
  organisationId?: string;
}) {
  switch (params.product) {
    case "provider_academy": {
      if (!params.referenceId) break;
      await prisma.providerAcademyEnrollment.upsert({
        where: {
          courseId_userId: {
            courseId: params.referenceId,
            userId: params.userId,
          },
        },
        create: {
          courseId: params.referenceId,
          userId: params.userId,
          status: "enrolled",
        },
        update: { status: "enrolled" },
      });
      break;
    }
    case "partner_api_program": {
      if (!params.organisationId) break;
      await prisma.partnerApiProgramEnrollment.create({
        data: {
          organisationId: params.organisationId,
          programTier: "standard",
          status: "approved",
          approvedAt: new Date(),
        },
      });
      break;
    }
    case "access_accreditation": {
      if (!params.referenceId) break;
      await prisma.accessAccreditationRequest.updateMany({
        where: { id: params.referenceId, userId: params.userId },
        data: { status: "paid" },
      });
      break;
    }
  }
}
