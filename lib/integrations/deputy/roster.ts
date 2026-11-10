import { z } from "zod";

import {
  findExternalMapping,
  markMappingNotApplicable,
  upsertExternalMapping,
} from "@/lib/integrations/delivery/mapping-service";
import { enqueueIntegrationDelivery } from "@/lib/integrations/delivery/outbox-service";
import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";
import { deputyFetch } from "@/lib/integrations/deputy/client";
import { prisma } from "@/lib/prisma";

export const createDraftRosterInputSchema = z.object({
  organisationId: z.string().min(1),
  careShiftId: z.string().min(1),
  workerProfileId: z.string().min(1),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  mealBreakMinutes: z.number().int().min(0).default(0),
  comment: z.string().max(500).optional(),
  /** When true, only enqueue outbox; do not call Deputy. */
  enqueueOnly: z.boolean().default(false),
});

export type CreateDraftRosterInput = z.infer<typeof createDraftRosterInputSchema>;

export type DraftRosterResult =
  | {
      status: "created" | "already_mapped" | "enqueued" | "dry_run";
      rosterId?: string;
      deliveryId?: string;
    }
  | { status: "not_applicable"; reason: string }
  | { status: "needs_mapping"; missing: "employee" | "opunit" };

/**
 * Create an unpublished Deputy draft roster (blnPublish=false).
 * Never publishes; never force-overwrites conflicting shifts.
 * Empty 200 body is treated as success-without-id → reconcile later.
 */
export async function createUnpublishedDraftRoster(
  input: CreateDraftRosterInput,
  deps: {
    http?: typeof deputyFetch;
  } = {},
): Promise<DraftRosterResult> {
  const parsed = createDraftRosterInputSchema.parse(input);
  const http = deps.http ?? deputyFetch;

  if (!integrationsFeatureFlags.deputyEnabled()) {
    return {
      status: "not_applicable",
      reason: "DEPUTY_ENABLED is false",
    };
  }

  const existing = await findExternalMapping({
    organisationId: parsed.organisationId,
    provider: "deputy",
    internalType: "care_shift",
    internalId: parsed.careShiftId,
  });
  if (existing?.syncState === "active" && !existing.externalId.startsWith("not_applicable:")) {
    return { status: "already_mapped", rosterId: existing.externalId };
  }

  const employeeMap = await findExternalMapping({
    organisationId: parsed.organisationId,
    provider: "deputy",
    internalType: "worker_profile",
    internalId: parsed.workerProfileId,
  });

  if (!employeeMap) {
    await markMappingNotApplicable({
      organisationId: parsed.organisationId,
      provider: "deputy",
      internalType: "worker_profile",
      internalId: parsed.workerProfileId,
      reason:
        "No authorised Deputy Employee ID mapping. Do not match by name/email alone.",
    });
    return { status: "needs_mapping", missing: "employee" };
  }

  if (employeeMap.syncState === "not_applicable") {
    return {
      status: "not_applicable",
      reason:
        (employeeMap.metadataJson as { reason?: string } | null)?.reason ??
        "Worker not part of connected Deputy installation",
    };
  }

  const opunitMap = await findExternalMapping({
    organisationId: parsed.organisationId,
    provider: "deputy",
    internalType: "deputy_opunit",
    internalId: parsed.organisationId,
  });
  if (!opunitMap || opunitMap.syncState === "not_applicable") {
    return { status: "needs_mapping", missing: "opunit" };
  }

  const dedupeKey = `deputy:care_shift:${parsed.careShiftId}:draft_roster:v1`;
  const { delivery, created } = await enqueueIntegrationDelivery({
    eventId: `deputy-draft-${parsed.careShiftId}`,
    aggregateType: "care_shift",
    aggregateId: parsed.careShiftId,
    aggregateRevision: 1,
    provider: "deputy",
    organisationId: parsed.organisationId,
    dedupeKey,
    payloadRef: {
      careShiftId: parsed.careShiftId,
      workerProfileId: parsed.workerProfileId,
    },
  });

  if (parsed.enqueueOnly) {
    return { status: "enqueued", deliveryId: delivery.id };
  }

  if (!created && delivery.state === "delivered") {
    const mapped = await findExternalMapping({
      organisationId: parsed.organisationId,
      provider: "deputy",
      internalType: "care_shift",
      internalId: parsed.careShiftId,
    });
    return {
      status: "already_mapped",
      rosterId: mapped?.externalId,
      deliveryId: delivery.id,
    };
  }

  if (integrationsFeatureFlags.dryRun()) {
    return { status: "dry_run", deliveryId: delivery.id };
  }

  const payload = {
    intStartTimestamp: Math.floor(parsed.startAt.getTime() / 1000),
    intEndTimestamp: Math.floor(parsed.endAt.getTime() / 1000),
    intRosterEmployee: Number(employeeMap.externalId),
    intOpunitId: Number(opunitMap.externalId),
    blnPublish: false,
    blnForceOverwrite: 0,
    blnOpen: 0,
    intMealbreakMinute: parsed.mealBreakMinutes,
    strComment: parsed.comment ?? `MapAble care shift ${parsed.careShiftId}`,
    intConfirmStatus: 0,
  };

  if (
    !Number.isFinite(payload.intRosterEmployee) ||
    !Number.isFinite(payload.intOpunitId)
  ) {
    return { status: "needs_mapping", missing: "employee" };
  }

  const res = await http("/api/v1/supervise/roster", {
    method: "POST",
    organisationId: parsed.organisationId,
    body: JSON.stringify(payload),
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Deputy roster create failed: HTTP ${res.status}`);
  }

  // Documented: success may return empty body. Prefer Id from JSON when present.
  const rosterId = extractRosterId(res.json);
  if (rosterId) {
    await upsertExternalMapping({
      organisationId: parsed.organisationId,
      provider: "deputy",
      internalType: "care_shift",
      internalId: parsed.careShiftId,
      externalId: String(rosterId),
      syncState: "active",
      metadataJson: { blnPublish: false, source: "create_response" },
    });
    await prisma.integrationDelivery.update({
      where: { id: delivery.id },
      data: {
        state: "delivered",
        deliveredAt: new Date(),
        lastErrorMessage: null,
      },
    });
    return { status: "created", rosterId: String(rosterId), deliveryId: delivery.id };
  }

  // Empty success: leave delivery needs_review for reconcile — do not invent an ID.
  await prisma.integrationDelivery.update({
    where: { id: delivery.id },
    data: {
      state: "needs_review",
      lastErrorClass: "empty_success_body",
      lastErrorMessage:
        "Deputy returned HTTP success without roster Id; reconcile via authenticated API",
    },
  });
  return { status: "enqueued", deliveryId: delivery.id };
}

function extractRosterId(json: unknown): string | number | null {
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;
  if (typeof obj.Id === "number" || typeof obj.Id === "string") return obj.Id;
  if (typeof obj.id === "number" || typeof obj.id === "string") return obj.id;
  if (typeof obj.intRosterId === "number" || typeof obj.intRosterId === "string") {
    return obj.intRosterId;
  }
  return null;
}

export async function updateUnpublishedDraftRoster(input: {
  organisationId: string;
  careShiftId: string;
  startAt: Date;
  endAt: Date;
  mealBreakMinutes?: number;
  publish?: boolean;
}) {
  if (input.publish) {
    throw new Error(
      "Publishing Deputy rosters requires explicit provider review API; refused",
    );
  }

  const mapping = await findExternalMapping({
    organisationId: input.organisationId,
    provider: "deputy",
    internalType: "care_shift",
    internalId: input.careShiftId,
  });
  if (!mapping || mapping.syncState !== "active") {
    throw new Error("No Deputy roster mapping for care shift");
  }

  if (integrationsFeatureFlags.dryRun() || !integrationsFeatureFlags.deputyEnabled()) {
    return { status: "dry_run" as const, rosterId: mapping.externalId };
  }

  const res = await deputyFetch("/api/v1/supervise/roster", {
    method: "POST",
    organisationId: input.organisationId,
    body: JSON.stringify({
      intRosterId: Number(mapping.externalId),
      intStartTimestamp: Math.floor(input.startAt.getTime() / 1000),
      intEndTimestamp: Math.floor(input.endAt.getTime() / 1000),
      blnPublish: false,
      blnForceOverwrite: 0,
      intMealbreakMinute: input.mealBreakMinutes ?? 0,
    }),
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Deputy roster update failed: HTTP ${res.status}`);
  }
  return { status: "updated" as const, rosterId: mapping.externalId };
}
