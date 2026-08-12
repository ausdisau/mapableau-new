import { NextResponse } from "next/server";
import { z } from "zod";

import { approveGovernedActionEnvelope } from "@/intelligence/actions/governed-envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isNavigatorProviderSearchPilotEnabled } from "@/lib/config/navigator-pilot";

export const runtime = "nodejs";

const bodySchema = z.object({
  tenantId: z.string().min(1).optional().nullable(),
  participantId: z.string().min(1).optional(),
  reason: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isNavigatorProviderSearchPilotEnabled()) {
    return NextResponse.json(
      { error: "NAVIGATOR_PILOT_DISABLED" },
      { status: 404 },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_FAILED", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const participantId = parsed.data.participantId ?? user.id;

  try {
    const envelope = await approveGovernedActionEnvelope({
      envelopeId: id,
      approverUserId: user.id,
      participantId,
      tenantId: parsed.data.tenantId,
      reason: parsed.data.reason,
    });
    return NextResponse.json({ envelope });
  } catch (error) {
    const message = error instanceof Error ? error.message : "APPROVE_FAILED";
    const status =
      message === "ENVELOPE_NOT_FOUND"
        ? 404
        : message === "ENVELOPE_EXPIRED"
          ? 410
          : message.includes("AUTHORITY") ||
              message.includes("DELEGATION") ||
              message.startsWith("CONSENT_") ||
              message === "MODEL_CANNOT_APPROVE"
            ? 403
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
