import { createHash } from "node:crypto";

import type {
  BillingRouteDispatchAdapter,
  RouteDispatchContext,
  RouteDispatchResult,
} from "@/lib/ndis-gateway/routing/adapters/types";
import { prisma } from "@/lib/prisma";

/**
 * NDIA portal export adapter: generates export once, stores checksum,
 * does NOT mark the batch/package as submitted.
 */
export class NdiaPortalExportAdapter implements BillingRouteDispatchAdapter {
  readonly kind = "ndia_portal_export";

  async dispatch(context: RouteDispatchContext): Promise<RouteDispatchResult> {
    const allowed = new Set(context.lineIds);
    const lines = context.lines.filter((l) => allowed.has(l.billableItemId));

    const header =
      "SupportItemCode,ServiceStart,ServiceEnd,Quantity,UnitPriceCents,TotalCents,BillableItemId";
    const rows = lines.map(
      (l) =>
        [
          l.supportItemCode ?? "",
          l.serviceStartAt.slice(0, 10),
          l.serviceEndAt.slice(0, 10),
          l.quantity,
          String(l.unitPriceCents),
          String(l.totalCents),
          l.billableItemId,
        ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const checksum = createHash("sha256").update(csv, "utf8").digest("hex");
    const fileName = `ndia-export-${context.correlationId.slice(0, 8)}.csv`;

    if (!context.dryRun && context.batchId) {
      await prisma.ndisBillingBatch.update({
        where: { id: context.batchId },
        data: {
          exportFileName: fileName,
          exportChecksum: checksum,
          exportedAt: new Date(),
          metadataJson: {
            adapter: this.kind,
            lineCount: lines.length,
            markedSubmitted: false,
            disclaimer:
              "Upload manually in the myplace provider portal. MapAble does not submit on your behalf.",
          },
        },
      });
    }

    return {
      adapterKind: this.kind,
      status: "export_generated",
      externalReference: fileName,
      contentChecksum: checksum,
      documentIds: [],
      payloadPreview: context.dryRun ? csv.slice(0, 500) : null,
      markedSubmitted: false,
      safeMessage:
        "NDIA export generated and checksum stored. Package is NOT marked submitted.",
    };
  }
}

export const ndiaPortalExportAdapter = new NdiaPortalExportAdapter();
