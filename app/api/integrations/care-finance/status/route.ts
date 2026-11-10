import { NextResponse } from "next/server";
import { z } from "zod";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";
import { runCareFinanceSlice } from "@/lib/integrations/orchestration/care-finance-slice";

export const runtime = "nodejs";

const bodySchema = z.object({
  organisationId: z.string().min(1),
  careBookingId: z.string().min(1),
  careShiftId: z.string().min(1),
  workerProfileId: z.string().min(1),
  billingInvoiceId: z.string().optional(),
  fundingSourceType: z
    .enum([
      "ndis_self_managed",
      "ndis_plan_managed",
      "ndis_agency_managed",
      "private_card",
      "private_pay",
      "organisation_invoice",
      "employer_funded",
      "insurance",
      "home_care_package",
      "grant",
      "grant_funded",
      "mixed",
      "other",
    ])
    .optional()
    .nullable(),
});

/**
 * Dry orchestration status for the Care finance vertical slice.
 * Does not charge cards, publish rosters, or authorise invoices.
 */
export async function POST(req: Request) {
  if (!integrationsFeatureFlags.stripeDirectBookingEnabled()) {
    return NextResponse.json(
      {
        live: false,
        enabled: false,
        message:
          "STRIPE_DIRECT_BOOKING_ENABLED is false. Status endpoint remains available for dry inspection when called with the flag on.",
      },
      { status: 403 },
    );
  }

  const user = await requireCurrentUser();
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const status = await runCareFinanceSlice({
    ...parsed.data,
    actorUserId: user.id,
  });

  return NextResponse.json({
    live: false,
    humanReviewRequired: true,
    status,
  });
}
