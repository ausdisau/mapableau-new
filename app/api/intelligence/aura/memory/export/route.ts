import { NextResponse } from "next/server";

import { jsonError, jsonOk } from "@/lib/api/response";
import { exportMemory } from "@/lib/aura/memory";
import type { CurrentUser } from "@/lib/auth/current-user";
import { withAuthorization } from "@/lib/auth/withAuthorization";

export const runtime = "nodejs";

/**
 * Memory export is high-risk (bulk preference disclosure).
 * Requires session-bound step-up MFA — rejects missing/forged client MFA evidence.
 */
export const GET = withAuthorization(
  {
    requireMfa: true,
  },
  async (_req, _ctx, user: CurrentUser) => {
    const subjectUserId = user.id;
    try {
      return jsonOk(exportMemory(subjectUserId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "AURA_ERROR";
      if (message === "MAPABLE_AURA_MEMORY_DISABLED") {
        return jsonError("AURA memory is not enabled", 503);
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }
  },
);
