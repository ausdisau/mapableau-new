import { z } from "zod";

import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { requireQsCapability } from "@/lib/quality-safeguards/capabilities";
import { isQualitySafeguardsOpsEnabled } from "@/lib/quality-safeguards/feature-flags";
import {
  createSafeguardSignal,
  listSafeguardSignals,
  redactAnonymousSignal,
  syncSignalsFromTrustSafetyQueue,
} from "@/lib/quality-safeguards/signals-service";

const createSignalSchema = z.object({
  organisationId: z.string().optional().nullable(),
  sourceType: z.enum([
    "participant_report",
    "worker_report",
    "complaint",
    "incident",
    "care_shift",
    "transport_trip",
    "job_service",
    "credential",
    "training",
    "service_note",
    "system_rule",
    "external_referral",
    "anonymous",
    "trust_safety_queue",
  ]),
  sourceId: z.string().optional().nullable(),
  participantId: z.string().optional().nullable(),
  workerId: z.string().optional().nullable(),
  providerId: z.string().optional().nullable(),
  serviceVertical: z
    .enum(["care", "transport", "jobs", "core", "other"])
    .optional(),
  summary: z.string().min(1).max(4000),
  observedAt: z.string().datetime(),
  urgency: z
    .enum(["critical", "high", "moderate", "low", "unassessed"])
    .optional(),
  immediateSafetyConcern: z.boolean().optional(),
  isAnonymous: z.boolean().optional(),
  assignedTeam: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  if (!isQualitySafeguardsOpsEnabled()) {
    return jsonError("Quality & Safeguards Ops Centre is disabled", 404);
  }

  const user = await requireApiAdminScope("qs:ops:read");
  if (user instanceof Response) return user;

  const capability = await requireQsCapability(user, "qs_ops_read");
  if (capability instanceof Response) return capability;

  const url = new URL(req.url);
  if (url.searchParams.get("sync") === "true") {
    await syncSignalsFromTrustSafetyQueue();
  }

  const organisationId = url.searchParams.get("organisationId");
  const status = url.searchParams.get("status") as
    | "new"
    | "triaged"
    | "linked"
    | "converted_to_case"
    | "dismissed_with_reason"
    | null;
  const immediateOnly = url.searchParams.get("immediateOnly") === "true";
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const offset = Number(url.searchParams.get("offset") ?? "0");

  const canViewIdentity = hasPermission(
    user.primaryRole,
    "complaint:view_identity"
  );

  const items = await listSafeguardSignals({
    organisationId: organisationId || undefined,
    status: status ?? undefined,
    immediateOnly,
    limit: Number.isFinite(limit) ? Math.min(limit, 100) : 50,
    offset: Number.isFinite(offset) ? offset : 0,
  });

  return jsonOk({
    items: items.map((item) => redactAnonymousSignal(item, canViewIdentity)),
    total: items.length,
  });
}

export async function POST(req: Request) {
  if (!isQualitySafeguardsOpsEnabled()) {
    return jsonError("Quality & Safeguards Ops Centre is disabled", 404);
  }

  const user = await requireApiAdminScope("qs:signal:triage");
  if (user instanceof Response) return user;

  const capability = await requireQsCapability(user, "qs_signal_triage");
  if (capability instanceof Response) return capability;

  const body = await req.json().catch(() => null);
  const parsed = createSignalSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const signal = await createSafeguardSignal({
    ...parsed.data,
    observedAt: new Date(parsed.data.observedAt),
    createdById: user.id,
  });

  return jsonOk({ signal }, 201);
}
