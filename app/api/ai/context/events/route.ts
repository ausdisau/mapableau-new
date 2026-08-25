import { z } from "zod";

import {
  CONTEXT_DOMAINS,
  CONTEXT_TYPES,
  DATA_CLASS_VALUES,
  DOMAIN_EVENT_TYPES,
  EVENT_PRODUCERS,
  SOURCE_TRUST_CLASSES,
  publishDomainEvent,
} from "@/lib/ai/platform/context-fabric";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonBodyErrorResponse, parseJsonRequestBody } from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isAgenticNerveCentreEnabled } from "@/lib/config/agentic-nerve-centre";
import { isContextFabricEnabled } from "@/lib/config/context-fabric";

export const runtime = "nodejs";

const bodySchema = z.object({
  eventType: z.enum(DOMAIN_EVENT_TYPES),
  domain: z.enum(CONTEXT_DOMAINS),
  aggregateType: z.string().min(1),
  aggregateId: z.string().min(1),
  tenantId: z.string().min(1),
  occurredAt: z.string().optional(),
  producer: z.enum(EVENT_PRODUCERS),
  schemaVersion: z.number().int().positive().optional(),
  evidenceRefs: z.array(z.string()).optional(),
  dataClasses: z.array(z.enum(DATA_CLASS_VALUES)).min(1),
  consentScopes: z.array(z.string()).optional(),
  subjectRefs: z
    .array(
      z.object({
        kind: z.enum([
          "participant",
          "mission",
          "provider",
          "worker",
          "venue",
          "job",
          "organisation",
        ]),
        id: z.string().min(1),
      }),
    )
    .optional(),
  missionIds: z.array(z.string()).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  traceId: z.string().min(1),
  idempotencyKey: z.string().nullable().optional(),
  sourceTrust: z.enum(SOURCE_TRUST_CLASSES),
  sourceRef: z.string().min(1),
  sourceAuthority: z.string().min(1),
  authenticated: z.boolean().optional(),
  adapterProvenance: z.string().nullable().optional(),
  contextType: z.enum(CONTEXT_TYPES).optional(),
});

/**
 * POST /api/ai/context/events
 * Internal authenticated domain-event ingest (not a public arbitrary-write API).
 */
export async function POST(req: Request) {
  if (!isAgenticNerveCentreEnabled()) return jsonError("AGENTIC_NERVE_CENTRE_DISABLED", 403);
  if (!isContextFabricEnabled()) return jsonError("CONTEXT_FABRIC_DISABLED", 403);

  const ip = getClientIp(req);
  if (!checkIpRateLimit(`ai-context-events:${ip}`, { windowMs: 60_000, max: 30 })) {
    return jsonError("RATE_LIMITED", 429);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = publishDomainEvent({
      ...parsed.data,
      schemaVersion: parsed.data.schemaVersion ?? 1,
      evidenceRefs: parsed.data.evidenceRefs ?? [],
      consentScopes: parsed.data.consentScopes ?? [],
      subjectRefs: parsed.data.subjectRefs ?? [],
      missionIds: parsed.data.missionIds ?? [],
      payload: parsed.data.payload ?? {},
      authenticated: parsed.data.authenticated ?? true,
    });

    await createAuditEvent({
      actorUserId: user.id,
      participantId: user.id,
      action: "context_fabric.event_published",
      entityType: "MapAbleDomainEvent",
      entityId: result.event.eventId,
      metadata: {
        eventType: result.event.eventType,
        duplicate: result.duplicate,
        targets: result.route.targets,
        recoveryIngested: result.recoveryIngested,
      },
    });

    return jsonOk({
      event: result.event,
      record: result.record,
      duplicate: result.duplicate,
      route: result.route,
      recoveryIngested: result.recoveryIngested,
      error: result.error,
    });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "EVENT_PUBLISH_FAILED", 400);
  }
}
