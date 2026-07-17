import {
  createRequestId,
  enforcePublicApiRateLimit,
  publicApiHeaders,
  weakEtag,
} from "@/lib/accountability/public-api";
import { verifySnapshotByPublicId } from "@/lib/accountability/public-reader";
import { accountabilityConfig } from "@/lib/config/accountability";

export async function GET(
  request: Request,
  context: { params: Promise<{ snapshotId: string }> }
) {
  if (!accountabilityConfig.publicApiEnabled) {
    return Response.json({ error: "Public API disabled" }, { status: 503 });
  }
  const limited = enforcePublicApiRateLimit(request);
  if (limited) return limited;

  const { snapshotId } = await context.params;
  const result = await verifySnapshotByPublicId(snapshotId);
  const requestId = createRequestId();
  if (!result) {
    return Response.json(
      { error: "Snapshot not found", requestId },
      { status: 404, headers: publicApiHeaders(requestId) }
    );
  }

  const payload = { apiVersion: "v1", ...result, requestId };
  const etag = weakEtag(payload);
  return Response.json(payload, {
    headers: publicApiHeaders(requestId, etag),
  });
}
