import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  recordContinuitySignal,
  validateSignal,
} from "@/lib/continuity/signals/signal-service";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  kind: z.enum([
    "care_shift_cancelled",
    "transport_booking_cancelled",
    "worker_unavailable",
    "provider_closure_notice",
    "no_show_pattern",
    "address_mismatch",
    "funding_expiring",
    "plan_reassessment_due",
    "life_event_declared",
    "aura_flag",
    "external_civic_feed",
    "reliability_incident",
    "provider_failure",
    "reservation_expired",
    "other",
  ]),
  participantId: z.string().nullable().optional(),
  organisationId: z.string().nullable().optional(),
  sourceKind: z.string().optional(),
  sourceRef: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  dedupeKey: z.string().min(1),
  observedAt: z.string().datetime(),
  confidence: z.enum(["low", "medium", "high", "verified"]).optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const raw = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return jsonError("Invalid signal payload", 400);
  try {
    const signal = await recordContinuitySignal({
      ...parsed.data,
      observedAt: new Date(parsed.data.observedAt),
    });
    return jsonOk({ signal }, 201);
  } catch (err) {
    return jsonError((err as Error).message ?? "SIGNAL_ERROR", 400);
  }
}

const validateSchema = z.object({
  signalId: z.string(),
  markConfidence: z.enum(["low", "medium", "high", "verified"]).optional(),
});

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const raw = await req.json().catch(() => null);
  const parsed = validateSchema.safeParse(raw);
  if (!parsed.success) return jsonError("Invalid validate payload", 400);
  try {
    const signal = await validateSignal(parsed.data);
    return jsonOk({ signal });
  } catch (err) {
    return jsonError((err as Error).message ?? "VALIDATE_ERROR", 400);
  }
}
