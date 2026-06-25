import { getRecentCommunityFeed } from "@/lib/access-reviews/access-report-service";
import { jsonOk } from "@/lib/api/response";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "30");

  const reports = await getRecentCommunityFeed({ limit });

  return jsonOk({
    feed: reports.map((r) => ({
      id: r.id,
      reportType: r.reportType,
      reviewBody: r.reviewBody,
      createdAt: r.createdAt,
      place: r.place,
    })),
  });
}
