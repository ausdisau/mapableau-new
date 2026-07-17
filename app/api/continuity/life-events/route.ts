import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  cancelLifeEvent,
  confirmLifeEvent,
  declareLifeEvent,
  listLifeEventsForParticipant,
} from "@/lib/life-events/life-event-service";

export const dynamic = "force-dynamic";

const declareSchema = z.object({
  action: z.literal("declare").default("declare"),
  participantId: z.string().min(1),
  organisationId: z.string().optional(),
  kind: z.enum([
    "address_change",
    "employment_change",
    "household_change",
    "hospital_admission",
    "hospital_discharge",
    "bereavement",
    "legal_status_change",
    "representative_change",
    "travel_planned",
    "service_pause_planned",
    "provider_wind_down",
    "provider_closure",
    "disaster_impact",
    "other",
  ]),
  source: z.enum([
    "participant_self",
    "delegate",
    "coordinator",
    "provider",
    "operational_signal",
    "civic_feed",
    "aura_suggestion",
  ]),
  title: z.string().min(1),
  narrative: z.string().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
  detailsJson: z.record(z.string(), z.unknown()).optional(),
  aiSuggested: z.boolean().optional(),
});

const confirmSchema = z.object({
  action: z.literal("confirm"),
  lifeEventId: z.string(),
  activate: z.boolean().optional(),
});

const cancelSchema = z.object({
  action: z.literal("cancel"),
  lifeEventId: z.string(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const raw = await req.json().catch(() => null);
  if (raw && raw.action === "confirm") {
    const parsed = confirmSchema.safeParse(raw);
    if (!parsed.success) return jsonError("Invalid confirm payload", 400);
    try {
      const out = await confirmLifeEvent({
        lifeEventId: parsed.data.lifeEventId,
        confirmedById: user.id,
        activate: parsed.data.activate,
      });
      return jsonOk(out);
    } catch (err) {
      return jsonError((err as Error).message ?? "CONFIRM_ERROR", 400);
    }
  }
  if (raw && raw.action === "cancel") {
    const parsed = cancelSchema.safeParse(raw);
    if (!parsed.success) return jsonError("Invalid cancel payload", 400);
    try {
      const ev = await cancelLifeEvent({
        lifeEventId: parsed.data.lifeEventId,
        cancelledById: user.id,
      });
      return jsonOk({ event: ev });
    } catch (err) {
      return jsonError((err as Error).message ?? "CANCEL_ERROR", 400);
    }
  }
  const parsed = declareSchema.safeParse(raw);
  if (!parsed.success) return jsonError("Invalid declare payload", 400);
  try {
    const ev = await declareLifeEvent({
      participantId: parsed.data.participantId,
      organisationId: parsed.data.organisationId,
      kind: parsed.data.kind,
      source: parsed.data.source,
      declaredById: user.id,
      title: parsed.data.title,
      narrative: parsed.data.narrative,
      effectiveFrom: parsed.data.effectiveFrom ? new Date(parsed.data.effectiveFrom) : undefined,
      effectiveTo: parsed.data.effectiveTo ? new Date(parsed.data.effectiveTo) : undefined,
      detailsJson: parsed.data.detailsJson,
      aiSuggested: parsed.data.aiSuggested,
    });
    return jsonOk({ event: ev }, 201);
  } catch (err) {
    return jsonError((err as Error).message ?? "DECLARE_ERROR", 400);
  }
}

const listSchema = z.object({
  participantId: z.string().min(1),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const url = new URL(req.url);
  const parsed = listSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return jsonError("participantId required", 400);
  const events = await listLifeEventsForParticipant(parsed.data.participantId, {
    limit: parsed.data.limit,
  });
  return jsonOk({ events });
}
