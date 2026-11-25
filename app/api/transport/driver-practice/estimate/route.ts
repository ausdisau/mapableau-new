import {
  configuredEstimateDependencies,
  corridorSchema,
  publicCorridorEstimate,
  RETRY_SECONDS,
} from "@/lib/transport/driver-practice/estimate-service";
export const dynamic = "force-dynamic";
// Only the three public, synthetic corridors are readable by standalone web builds.
const headers = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Accept",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers });
}

/** @public Accepts a named synthetic corridor only. Assigned trips use the signed-in roster. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = corridorSchema.safeParse(params.get("corridor"));
  if (!id.success || [...params].length !== 1)
    return Response.json(
      { error: "Choose a public practice corridor." },
      { status: 400, headers },
    );
  const deps = configuredEstimateDependencies();
  if (!deps)
    return Response.json(
      { error: "Practice routing is not configured." },
      { status: 503, headers },
    );
  try {
    const result = await publicCorridorEstimate(id.data, deps);
    if (!result)
      return Response.json(
        { error: "A refresh is already in progress." },
        {
          status: 429,
          headers: { ...headers, "Retry-After": String(RETRY_SECONDS) },
        },
      );
    return Response.json(result, { headers });
  } catch {
    return Response.json(
      { error: "A fresh estimate is unavailable." },
      { status: 503, headers },
    );
  }
}
