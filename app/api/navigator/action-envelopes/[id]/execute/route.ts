import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/current-user";
import { isNavigatorProviderSearchPilotEnabled } from "@/lib/config/navigator-pilot";
import { executeNavigatorEnvelope } from "@/lib/navigator/pilot/execute-envelope";

export const runtime = "nodejs";

const bodySchema = z.object({
  nonce: z.string().min(1),
  tenantId: z.string().min(1).optional().nullable(),
  participantId: z.string().min(1).optional(),
  confirmed: z.literal(true),
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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
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
    const outcome = await executeNavigatorEnvelope({
      envelopeId: id,
      actorUserId: user.id,
      participantId,
      tenantId: parsed.data.tenantId,
      nonce: parsed.data.nonce,
    });
    return NextResponse.json(outcome, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "EXECUTE_FAILED";
    const status =
      message === "ENVELOPE_NOT_FOUND"
        ? 404
        : message === "ENVELOPE_EXPIRED"
          ? 410
          : message === "ENVELOPE_ALREADY_USED" ||
              message === "ENVELOPE_REPLAY_OR_BAD_NONCE"
            ? 409
            : message.includes("AUTHORITY") ||
                message.includes("DELEGATION") ||
                message.startsWith("CONSENT_") ||
                message.startsWith("CAPABILITY_DENIED") ||
                message === "NAVIGATOR_PILOT_DISABLED"
              ? 403
              : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
