import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { searchMapAble } from "@/lib/search/mapable-search-service";
import {
  formatPublicSearchStreamEvent,
  publicStreamRequestSchema,
  type PublicSearchStreamEvent,
} from "@/lib/search/mapable-stream-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const MAX_BODY_BYTES = 4096;
const MAX_STREAMED_RESULTS = 12;

/**
 * Public streaming is OFF by default. Production additionally requires an
 * independently verified distributed ingress limiter; the in-process limiter
 * below is only a preview defence-in-depth mechanism.
 */
function publicStreamingAllowed(): boolean {
  if (process.env.MAPABLE_SEARCH_STREAM_ENABLED !== "true") return false;
  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.MAPABLE_SEARCH_STREAM_DISTRIBUTED_GATE_VERIFIED !== "true"
  ) return false;
  return true;
}

function publicError(message: string, status: number): Response {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
  );
}

/** Read only a strictly bounded request body, even without Content-Length. */
async function readBoundedJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("INVALID_BODY");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) throw new Error("BODY_TOO_LARGE");
      chunks.push(value);
    }
  } finally {
    if (size > MAX_BODY_BYTES) await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  const raw = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    raw.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw)) as unknown;
}

/**
 * This is an evidence-guided, deterministic stream over the existing approved
 * MapAble public Search service. It is NOT an LLM endpoint, and never loads
 * private profiles, participant NDIS plans, worker records or ads.
 */
export async function POST(request: Request): Promise<Response> {
  if (!publicStreamingAllowed()) return publicError("Streaming search is not available.", 404);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return publicError("Send an application/json request.", 415);
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return publicError("Search request is too large.", 413);
  }
  if (!checkIpRateLimit(`mapable-search-stream:${getClientIp(request)}`, {
    max: 12, windowMs: 60_000,
  })) {
    return publicError("Too many requests. Try again later.", 429);
  }

  let input: unknown;
  try {
    input = await readBoundedJson(request);
  } catch (error) {
    return publicError(
      error instanceof Error && error.message === "BODY_TOO_LARGE"
        ? "Search request is too large." : "Invalid request body.",
      error instanceof Error && error.message === "BODY_TOO_LARGE" ? 413 : 400,
    );
  }
  const parsed = publicStreamRequestSchema.safeParse(input);
  if (!parsed.success) return publicError("Invalid public search fields.", 400);

  const encoder = new TextEncoder();
  const responseBody = new ReadableStream<Uint8Array>({
    async start(controller) {
      let finished = false;
      const emit = (event: PublicSearchStreamEvent) => {
        if (finished || request.signal.aborted) return;
        controller.enqueue(encoder.encode(formatPublicSearchStreamEvent(event)));
      };
      try {
        emit({ type: "search.started", requestId: crypto.randomUUID() });
        emit({
          type: "message.delta",
          text: "Checking public MapAble information and available evidence. ",
        });

        const result = await searchMapAble({
          q: parsed.data.message,
          vertical: parsed.data.vertical,
        });
        if (request.signal.aborted) return;

        const bounded = result.results.slice(0, MAX_STREAMED_RESULTS);
        const distinctSources = new Set<string>();
        for (const hit of bounded) {
          if (!distinctSources.has(hit.sourceLabel)) {
            distinctSources.add(hit.sourceLabel);
            emit({ type: "source.found", label: hit.sourceLabel });
          }
          emit({ type: "result.upsert", result: hit });
        }
        emit({
          type: "spatial.updated",
          available: false,
          explanation: "These results do not provide validated coordinates or accessible journey geometry. Use the list view.",
        });

        if (bounded.length === 0) {
          emit({
            type: "message.delta",
            text: "No matching entries were found in the enabled public index. This does not mean a suitable service does not exist. ",
          });
        } else if (result.sourceState === "navigation_only") {
          emit({
            type: "message.delta",
            text: `I found ${bounded.length} MapAble destination${bounded.length === 1 ? "" : "s"} to explore. This is navigation, not confirmed service matching. `,
          });
        } else {
          emit({
            type: "message.delta",
            text: `I found ${bounded.length} public result${bounded.length === 1 ? "" : "s"}. Imported directory entries are not live registration or accessibility checks. `,
          });
        }
        emit({
          type: "message.delta",
          text: "Ceiling hoists, entrance dimensions, quiet spaces, worker screening, transport accessibility and availability remain unknown unless supported by specific evidence. You can inspect the sources or contact MapAble for assistance.",
        });
        emit({
          type: "search.completed",
          resultCount: bounded.length,
          sourceState: result.sourceState,
          warnings: result.warnings.slice(0, 6),
        });
      } catch {
        emit({
          type: "search.error",
          message: "Public search is temporarily unavailable. Try the ordinary search or contact MapAble.",
        });
      } finally {
        finished = true;
        try { controller.close(); } catch { /* Client may have cancelled. */ }
      }
    },
    cancel() {
      // No persistent transcript is written; a cancelled fetch stops its UI.
    },
  });

  return new Response(responseBody, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Content-Type-Options": "nosniff",
      "X-Accel-Buffering": "no",
    },
  });
}
