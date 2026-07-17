import { createHash } from "node:crypto";

import type {
  BillingRouteDispatchAdapter,
  RouteDispatchContext,
  RouteDispatchResult,
} from "@/lib/ndis-gateway/routing/adapters/types";

/**
 * Builds per-participant invoice drafts from the provided line IDs only.
 * Does NOT load or iterate the whole batch inside the participant loop.
 */
export class SelfManagedDispatchAdapter implements BillingRouteDispatchAdapter {
  readonly kind = "self_managed_invoice";

  async dispatch(context: RouteDispatchContext): Promise<RouteDispatchResult> {
    const allowed = new Set(context.lineIds);
    const lines = context.lines.filter((l) => allowed.has(l.billableItemId));
    if (lines.length === 0) {
      return {
        adapterKind: this.kind,
        status: "draft_built",
        externalReference: null,
        contentChecksum: null,
        documentIds: [],
        markedSubmitted: false,
        safeMessage: "No matching lines for self-managed draft.",
      };
    }

    const byParticipant = new Map<string, typeof lines>();
    for (const line of lines) {
      const pid = line.participantId ?? "unknown";
      const list = byParticipant.get(pid) ?? [];
      list.push(line);
      byParticipant.set(pid, list);
    }

    const drafts = [...byParticipant.entries()].map(([participantId, pLines]) => ({
      participantId,
      lineIds: pLines.map((l) => l.billableItemId),
      totalCents: pLines.reduce((s, l) => s + l.totalCents, 0),
      lineCount: pLines.length,
    }));

    const payload = JSON.stringify({
      adapter: this.kind,
      organisationId: context.organisationId,
      drafts,
      dryRun: Boolean(context.dryRun),
    });
    const checksum = createHash("sha256").update(payload, "utf8").digest("hex");

    return {
      adapterKind: this.kind,
      status: "draft_built",
      externalReference: `SM-DRAFT-${context.correlationId.slice(0, 8)}`,
      contentChecksum: checksum,
      documentIds: [],
      payloadPreview: context.dryRun ? payload : null,
      markedSubmitted: false,
      safeMessage: `Built ${drafts.length} self-managed participant draft(s) from ${lines.length} provided line(s).`,
    };
  }
}

export const selfManagedDispatchAdapter = new SelfManagedDispatchAdapter();
