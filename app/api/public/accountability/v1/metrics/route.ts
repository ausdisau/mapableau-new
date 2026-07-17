import {
  createRequestId,
  enforcePublicApiRateLimit,
  paginate,
  publicApiHeaders,
  weakEtag,
} from "@/lib/accountability/public-api";
import { listPublishedHeadlineMetrics } from "@/lib/accountability/public-reader";
import { accountabilityConfig } from "@/lib/config/accountability";

export async function OPTIONS() {
  const requestId = createRequestId();
  return new Response(null, {
    status: 204,
    headers: publicApiHeaders(requestId),
  });
}

export async function GET(request: Request) {
  if (!accountabilityConfig.publicApiEnabled) {
    return Response.json({ error: "Public API disabled" }, { status: 503 });
  }
  const limited = enforcePublicApiRateLimit(request);
  if (limited) return limited;

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "25");
  const metrics = await listPublishedHeadlineMetrics();
  const payload = {
    apiVersion: "v1",
    ...paginate(
      metrics.map((m) => ({
        code: m.publicCode,
        name: m.name,
        domain: m.domain,
        unit: m.unit,
        value: m.value,
        numerator: m.numerator,
        denominator: m.denominator,
        target: m.target,
        sampleSize: m.sampleSize,
        reportingPeriodStart: m.reportingPeriodStart,
        reportingPeriodEnd: m.reportingPeriodEnd,
        methodologyCode: m.methodologyPublicCode,
        accessibleSummary: m.accessibleSummary,
        trendDescription: m.trendDescription,
        statusAgainstTarget: m.statusAgainstTarget,
        suppressionReason: m.suppressionReason,
        isDemonstration: m.isDemonstration,
      })),
      page,
      pageSize
    ),
  };

  const etag = weakEtag(payload);
  const requestId = createRequestId();
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: publicApiHeaders(requestId, etag),
    });
  }

  return Response.json(
    { ...payload, requestId },
    { headers: publicApiHeaders(requestId, etag) }
  );
}
