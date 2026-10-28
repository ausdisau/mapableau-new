import { listPublishedPlaces } from "@/lib/access/map/access-place-service";
import {
  allowedPlacesOrigin,
  isPlacesPrototypeEnabled,
  toPublicPlacesRecord,
} from "@/lib/places/integration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function responseHeaders(origin: string | null): HeadersInit {
  return {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin",
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
  };
}

function permittedOrigin(request: Request): { origin: string | null; rejected: boolean } {
  const supplied = request.headers.get("origin");
  if (!supplied) return { origin: null, rejected: false };
  const serverOrigin = new URL(request.url).origin;
  const origin = allowedPlacesOrigin(supplied, serverOrigin);
  return { origin, rejected: !origin };
}

/** CORS preflight for an explicitly approved Expo Web preview origin only. */
export async function OPTIONS(request: Request) {
  if (!isPlacesPrototypeEnabled()) {
    return new Response(null, { status: 404 });
  }
  const { origin, rejected } = permittedOrigin(request);
  if (rejected || !origin) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      ...responseHeaders(origin),
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Accept, Content-Type",
      "Access-Control-Max-Age": "300",
    },
  });
}

/**
 * A read-only, feature-gated adapter over the canonical published MapAble
 * directory. It never accesses personal access preferences, location history,
 * venue check-ins or CripSquare memberships.
 */
export async function GET(request: Request) {
  if (!isPlacesPrototypeEnabled()) {
    return Response.json({ error: "Places prototype is disabled" }, {
      status: 404, headers: responseHeaders(null),
    });
  }
  const { origin, rejected } = permittedOrigin(request);
  if (rejected) {
    return Response.json({ error: "Origin not approved" }, {
      status: 403, headers: responseHeaders(null),
    });
  }
  try {
    const results = await listPublishedPlaces(50);
    return Response.json({
      places: results.map(toPublicPlacesRecord),
      source: "MapAble published place directory",
      evidenceStatus: "directory-summary-only",
      message:
        "Place membership in the directory does not establish personal accessibility suitability.",
    }, { status: 200, headers: responseHeaders(origin) });
  } catch {
    return Response.json({
      places: [],
      error: "The published MapAble directory is currently unavailable",
    }, { status: 503, headers: responseHeaders(origin) });
  }
}
