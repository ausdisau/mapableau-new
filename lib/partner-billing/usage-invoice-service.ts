import { countUsageInPeriod } from "@/lib/usage/usage-ledger";
import { prisma } from "@/lib/prisma";

import { createPartnerInvoice } from "./billing-service";

const API_OVERAGE_CENTS_PER_1000 = 500;

export async function generateMonthlyApiUsageInvoice(params: {
  organisationId: string;
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date;
  includedCalls?: number;
}) {
  const account = await prisma.partnerBillingAccount.findUnique({
    where: { organisationId: params.organisationId },
  });
  if (!account) {
    return { ok: false as const, error: "Partner billing account not found" };
  }

  const totalCalls = await countUsageInPeriod({
    category: "api_call",
    eventType: "developer_api.request",
    organisationId: params.organisationId,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
  });

  const included = params.includedCalls ?? 10_000;
  const overage = Math.max(0, totalCalls - included);
  const overageBlocks = Math.ceil(overage / 1000);
  const amountCents = overageBlocks * API_OVERAGE_CENTS_PER_1000;

  if (amountCents === 0) {
    return {
      ok: true as const,
      invoice: null,
      totalCalls,
      overage: 0,
      amountCents: 0,
    };
  }

  const invoice = await createPartnerInvoice(
    account.id,
    params.periodLabel,
    amountCents
  );

  return {
    ok: true as const,
    invoice,
    totalCalls,
    overage,
    amountCents,
  };
}
