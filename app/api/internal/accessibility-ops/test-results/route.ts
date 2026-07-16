import { ingestSignedTestResults } from "@/lib/accessibility-ops/runners/result-ingest";
import type { SignedTestResultPayload } from "@/lib/accessibility-ops/runners/signing";
import { emitAccessibilityOpsAudit } from "@/lib/accessibility-ops/audit/emit";
import { mapOpsError, requireOpsFlag } from "@/lib/accessibility-ops/http";
import { timingSafeEqual } from "crypto";

function authorizeRunner(request: Request): boolean {
  const provided = request.headers.get("x-mapable-runner-secret") ?? "";
  const expected =
    process.env.MAPABLE_ACCESSIBILITY_OPS_RUNNER_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "";
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Internal runner ingest — organisation-scoped shadow recording only.
 * Classification: internal runner. Never blocks releases in Wave 2.
 */
export async function POST(request: Request) {
  const disabled = requireOpsFlag("testLab");
  if (disabled) return disabled;

  if (!authorizeRunner(request)) {
    return Response.json({ error: "Unauthorized runner" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      assetId: string;
      assetVersionId?: string | null;
      correlationId?: string;
      results: SignedTestResultPayload[];
    };

    if (!body.assetId || !Array.isArray(body.results)) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const ingested = ingestSignedTestResults({
      assetId: body.assetId,
      assetVersionId: body.assetVersionId,
      correlationId: body.correlationId,
      results: body.results,
    });

    await emitAccessibilityOpsAudit({
      action: "accessibility_ops.test.result_recorded",
      entityType: "AccessibilityShadowEvaluation",
      entityId: ingested.evaluation.evaluationId,
      correlationId: ingested.evaluation.correlationId,
      metadata: {
        acceptedCount: ingested.acceptedCount,
        rejectedCount: ingested.rejected.length,
        blocking: ingested.blocking,
        mode: ingested.mode,
      },
    });

    return Response.json({ ingest: ingested });
  } catch (error) {
    return mapOpsError(error);
  }
}
