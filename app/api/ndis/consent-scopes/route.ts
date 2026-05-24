import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { grantNdisConsent, revokeNdisConsent } from "@/lib/ndis/ndis-consent-service";

const grantSchema = z.object({
  participantId: z.string(),
  grantedToId: z.string(),
  scope: z.enum([
    "plan_dates",
    "plan_goals",
    "budget_summary",
    "funded_supports",
    "provider_relationships",
    "service_booking_refs",
    "claim_status",
    "payment_status",
  ]),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const parsed = grantSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const grant = await grantNdisConsent({
    ...parsed.data,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
  });

  return NextResponse.json({ grant }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(request.url);
  const grantId = searchParams.get("grantId");
  if (!grantId) {
    return NextResponse.json({ error: "grantId required" }, { status: 400 });
  }

  const grant = await revokeNdisConsent(grantId);
  return NextResponse.json({ grant });
}
