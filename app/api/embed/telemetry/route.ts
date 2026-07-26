import { z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

const BodySchema = z.object({
  event: z.literal("widget_view"),
  locationId: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,128}$/, "Invalid location id"),
  path: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
  ts: z.string().max(64).optional(),
});

/**
 * Best-effort embed widget telemetry. No auth — location id only, no PII.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await createAuditEvent({
      action: "embed.widget_view",
      entityType: "EmbedWidget",
      entityId: parsed.data.locationId,
      metadata: {
        event: parsed.data.event,
        path: parsed.data.path ?? null,
        referrerHost: safeReferrerHost(parsed.data.referrer),
        clientTs: parsed.data.ts ?? null,
      },
    });
  } catch {
    // Telemetry must never fail the widget hard.
    return jsonError("Telemetry unavailable", 503);
  }

  return jsonOk({ ok: true });
}

function safeReferrerHost(referrer: string | undefined): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).host.slice(0, 200);
  } catch {
    return null;
  }
}
