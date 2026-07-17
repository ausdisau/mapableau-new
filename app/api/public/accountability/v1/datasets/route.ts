import {
  createRequestId,
  enforcePublicApiRateLimit,
  paginate,
  publicApiHeaders,
  weakEtag,
} from "@/lib/accountability/public-api";
import { listPublishedDatasets } from "@/lib/accountability/public-reader";
import { accountabilityConfig } from "@/lib/config/accountability";

export async function GET(request: Request) {
  if (!accountabilityConfig.publicApiEnabled) {
    return Response.json({ error: "Public API disabled" }, { status: 503 });
  }
  const limited = enforcePublicApiRateLimit(request);
  if (limited) return limited;

  const url = new URL(request.url);
  const datasets = await listPublishedDatasets();
  const payload = {
    apiVersion: "v1",
    ...paginate(
      datasets.map((d) => ({
        id: d.publicId,
        title: d.title,
        description: d.description,
        publisher: d.publisher,
        licence: d.licence,
        latestVersion: d.versions[0]
          ? {
              version: d.versions[0].version,
              checksum: d.versions[0].checksum,
              recordCount: d.versions[0].recordCount,
            }
          : null,
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
