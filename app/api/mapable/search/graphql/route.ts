import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  federatedDirectoryFlags,
  persistedDirectoryOperation,
  queryPublicDirectory,
} from "@/lib/mapable-search/federated-public-directory";
import {
  mapAbleNeonPublicProviders,
  mapAbleSupabasePublicOutlets,
} from "@/lib/mapable-search/public-provider-sources.server";

/**
 * One fixed GraphQL-shaped persisted operation. There is deliberately no
 * general GraphQL parser, introspection, mutations, free-form SQL, or schema
 * federation. Extend this only after a separately reviewed schema/tool policy.
 *
 * The endpoint is OFF by default. Production release additionally requires a
 * distributed abuse limiter and source-specific privacy/evidence audit.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function errorResponse(message: string, status: number) {
  return Response.json(
    { data: null, errors: [{ message }] },
    { status, headers: JSON_HEADERS },
  );
}

export async function POST(request: Request): Promise<Response> {
  const flags = federatedDirectoryFlags();
  if (!flags.endpoint) return errorResponse("Search endpoint unavailable.", 404);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return errorResponse("Expected an application/json request.", 415);
  }
  const size = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isFinite(size) || size > 8192) {
    return errorResponse("Request too large.", 413);
  }

  // Local-only defence in depth, NOT a multi-instance abuse guarantee.
  if (!checkIpRateLimit(getClientIp(request), { max: 15, windowMs: 60_000 })) {
    return errorResponse("Rate limit reached; try again later.", 429);
  }

  let payload: unknown;
  try {
    const text = await request.text();
    if (text.length > 8192) return errorResponse("Request too large.", 413);
    payload = JSON.parse(text) as unknown;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const operation = persistedDirectoryOperation.safeParse(payload);
  if (!operation.success) {
    return errorResponse("Only the approved MapAbleDirectory query is supported.", 400);
  }

  try {
    const result = await queryPublicDirectory(operation.data.variables, [
      { enabled: flags.neon, adapter: mapAbleNeonPublicProviders },
      { enabled: flags.supabase, adapter: mapAbleSupabasePublicOutlets },
    ]);
    const errors: { message: string }[] = [];
    if (result.sources.neon === "unavailable") {
      errors.push({ message: "Neon public directory temporarily unavailable." });
    }
    if (result.sources.supabase === "unavailable") {
      errors.push({ message: "Supabase public directory temporarily unavailable." });
    }
    return Response.json(
      {
        data: { mapAbleDirectory: result },
        ...(errors.length ? { errors } : {}),
      },
      { status: 200, headers: JSON_HEADERS },
    );
  } catch {
    // Never expose connection strings, table names or provider internals.
    return errorResponse("MapAble public search is temporarily unavailable.", 503);
  }
}
