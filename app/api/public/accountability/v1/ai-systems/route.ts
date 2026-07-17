import {
  createRequestId,
  enforcePublicApiRateLimit,
  paginate,
  publicApiHeaders,
  weakEtag,
} from "@/lib/accountability/public-api";
import { listPublishedAiSystems } from "@/lib/accountability/public-reader";
import { accountabilityConfig } from "@/lib/config/accountability";

export async function GET(request: Request) {
  if (!accountabilityConfig.publicApiEnabled) {
    return Response.json({ error: "Public API disabled" }, { status: 503 });
  }
  const limited = enforcePublicApiRateLimit(request);
  if (limited) return limited;

  const url = new URL(request.url);
  const systems = await listPublishedAiSystems();
  const payload = {
    apiVersion: "v1",
    ...paginate(
      systems.map((s) => ({
        code: s.publicCode,
        name: s.name,
        purpose: s.purpose,
        decisionRole: s.decisionRole,
        humanReviewRequired: s.humanReviewRequired,
        retirementStatus: s.retirementStatus,
        isDemonstration: s.isDemonstration,
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
