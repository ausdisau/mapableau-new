import {
  createRequestId,
  enforcePublicApiRateLimit,
  paginate,
  publicApiHeaders,
  weakEtag,
} from "@/lib/accountability/public-api";
import { listPublishedCommitments } from "@/lib/accountability/public-reader";
import { accountabilityConfig } from "@/lib/config/accountability";

export async function GET(request: Request) {
  if (!accountabilityConfig.publicApiEnabled) {
    return Response.json({ error: "Public API disabled" }, { status: 503 });
  }
  const limited = enforcePublicApiRateLimit(request);
  if (limited) return limited;

  const url = new URL(request.url);
  const commitments = await listPublishedCommitments({
    status: url.searchParams.get("status") ?? undefined,
    serviceVertical: url.searchParams.get("service") ?? undefined,
  });
  const payload = {
    apiVersion: "v1",
    ...paginate(
      commitments.map((c) => ({
        slug: c.slug,
        title: c.title,
        status: c.status,
        accountableBody: c.accountableBody,
        serviceVertical: c.serviceVertical,
        targetDate: c.targetDate,
        isDemonstration: c.isDemonstration,
      })),
      Number(url.searchParams.get("page") ?? "1"),
      Number(url.searchParams.get("pageSize") ?? "25")
    ),
  };
  const etag = weakEtag(payload);
  const requestId = createRequestId();
  return Response.json(
    { ...payload, requestId },
    { headers: publicApiHeaders(requestId, etag) }
  );
}
