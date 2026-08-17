import { NextResponse } from "next/server";

import { canTriggerAdminIngestion } from "@/lib/admin/cron-auth";
import { getObjectStorageConfig } from "@/lib/config/object-storage";
import { storageErrorResponse } from "@/lib/storage/http";
import { reconcileOrphanedUploads } from "@/lib/storage/upload-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/storage-orphan-reconciliation
 * Marks stale pending upload sessions as orphaned. Does not delete objects
 * whose Neon state is ambiguous.
 */
export async function GET(request: Request) {
  if (!(await canTriggerAdminIngestion(request))) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (!getObjectStorageConfig().enabled) {
    return NextResponse.json(
      { error: "Object storage is disabled", productionClaim: "none" },
      { status: 404 },
    );
  }
  try {
    const result = await reconcileOrphanedUploads();
    return NextResponse.json({
      ...result,
      claimState: "in_development",
      note: "Orphaned sessions are marked, not immediately deleted.",
    });
  } catch (err) {
    return storageErrorResponse(err);
  }
}
