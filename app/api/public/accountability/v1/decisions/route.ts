import {
  createRequestId,
  enforcePublicApiRateLimit,
  paginate,
  publicApiHeaders,
  weakEtag,
} from "@/lib/accountability/public-api";
import { listPublishedGovernanceDecisions } from "@/lib/accountability/public-reader";
import { accountabilityConfig } from "@/lib/config/accountability";

export async function GET(request: Request) {
  if (!accountabilityConfig.publicApiEnabled) {
    return Response.json({ error: "Public API disabled" }, { status: 503 });
  }
  const limited = enforcePublicApiRateLimit(request);
  if (limited) return limited;

  const url = new URL(request.url);
  const decisions = await listPublishedGovernanceDecisions();
  const payload = {
    apiVersion: "v1",
    ...paginate(
      decisions.map((d) => ({
        id: d.publicId,
        decisionDate: d.decisionDate,
        decisionBody: d.decisionBody,
        questionConsidered: d.questionConsidered,
        decisionSummary: d.decisionSummary,
        isDemonstration: d.isDemonstration,
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
