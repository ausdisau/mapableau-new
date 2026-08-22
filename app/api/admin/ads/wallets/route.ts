import { z } from "zod";

import { manualWalletAdjustment } from "@/lib/ads/billing/wallet";
import { microsToString, parseMicrosString } from "@/lib/ads/money/micros";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const wallets = await prisma.adWallet.findMany({
    include: {
      advertiser: { select: { id: true, name: true, organisationId: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return jsonOk({
    wallets: wallets.map((w) => ({
      id: w.id,
      advertiserId: w.advertiserId,
      advertiserName: w.advertiser.name,
      currency: w.currency,
      status: w.status,
      availableMicros: microsToString(w.availableMicros),
    })),
  });
}

const adjustSchema = z.object({
  walletId: z.string().min(1),
  type: z.enum(["MANUAL_CREDIT", "MANUAL_DEBIT"]),
  amountMicros: z.string().regex(/^\d+$/),
  reason: z.string().min(3).max(500),
  idempotencyKey: z.string().min(8).max(120),
});

export async function POST(request: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = adjustSchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await manualWalletAdjustment({
      walletId: parsed.data.walletId,
      amountMicros: parseMicrosString(parsed.data.amountMicros),
      type: parsed.data.type,
      reason: parsed.data.reason,
      actorUserId: user.id,
      idempotencyKey: parsed.data.idempotencyKey,
    });
    return jsonOk({
      balanceAfterMicros: microsToString(result.balanceAfter),
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Adjustment failed", 400);
  }
}
