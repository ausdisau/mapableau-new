import { getAccessIntelligenceRepository } from "@/lib/access-intelligence/repositories";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (!q.trim()) {
    return Response.json({ error: "Query q is required.", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  const repo = getAccessIntelligenceRepository();
  const results = await repo.searchPlaces(q);
  return Response.json({ count: results.length, places: results });
}
