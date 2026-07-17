import { createHash } from "node:crypto";

import type {
  BillingRouteDispatchAdapter,
  RouteDispatchContext,
  RouteDispatchResult,
} from "@/lib/ndis-gateway/routing/adapters/types";

export class PrivatePayDispatchAdapter implements BillingRouteDispatchAdapter {
  readonly kind = "private_pay_invoice";

  async dispatch(context: RouteDispatchContext): Promise<RouteDispatchResult> {
    const allowed = new Set(context.lineIds);
    const lines = context.lines.filter((l) => allowed.has(l.billableItemId));
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
    }));

    const payload = JSON.stringify({ adapter: this.kind, drafts });
    const checksum = createHash("sha256").update(payload, "utf8").digest("hex");

    return {
      adapterKind: this.kind,
      status: "draft_built",
      externalReference: `PP-DRAFT-${context.correlationId.slice(0, 8)}`,
      contentChecksum: checksum,
      documentIds: [],
      markedSubmitted: false,
      safeMessage: `Built ${drafts.length} private-pay draft(s) (one participant per invoice).`,
    };
  }
}

export const privatePayDispatchAdapter = new PrivatePayDispatchAdapter();
