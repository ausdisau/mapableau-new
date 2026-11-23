import { z } from "zod";

/**
 * Public MapAble Search streaming protocol.
 * Deliberately excludes identity, saved profiles, access preferences,
 * billing, advertisement inputs, worker identifiers and live geometry.
 */
export const publicStreamRequestSchema = z.object({
  message: z.string().trim().min(2).max(180),
  vertical: z.enum(["all", "places", "providers", "care", "transport", "jobs"]),
  publicSearchApproved: z.literal(true),
}).strict();

export type PublicStreamRequest = z.infer<typeof publicStreamRequestSchema>;

const hitSchema = z.object({
  id: z.string().min(1).max(200),
  kind: z.enum(["module", "provider_outlet"]),
  vertical: z.enum(["places", "providers", "care", "transport", "jobs"]),
  title: z.string().max(250),
  description: z.string().max(1500),
  href: z.string().startsWith("/"),
  provenance: z.enum(["mapable_navigation", "local_ndis_directory_import"]),
  sourceLabel: z.string().max(250),
  sourceUrl: z.string().url().optional(),
  directoryUpdatedAt: z.string().optional(),
  registration: z.literal("not_independently_verified"),
  workerScreening: z.literal("not_independently_verified"),
  accessFit: z.literal("unknown"),
  availability: z.literal("unknown"),
}).strict();

export const publicSearchStreamEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("search.started"),
    requestId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("source.found"),
    label: z.string().max(250),
  }),
  z.object({
    type: z.literal("result.upsert"),
    result: hitSchema,
  }),
  z.object({
    type: z.literal("message.delta"),
    text: z.string().max(1500),
  }),
  z.object({
    type: z.literal("spatial.updated"),
    available: z.literal(false),
    explanation: z.string().max(300),
  }),
  z.object({
    type: z.literal("search.completed"),
    resultCount: z.number().int().nonnegative(),
    sourceState: z.enum(["navigation_only", "imported_provider_index", "partial"]),
    warnings: z.array(z.string().max(600)).max(6),
  }),
  z.object({
    type: z.literal("search.error"),
    message: z.string().max(300),
  }),
]);

export type PublicSearchStreamEvent = z.infer<typeof publicSearchStreamEventSchema>;

/** Stream events as SSE, without exposing internal tool or model traces. */
export function formatPublicSearchStreamEvent(event: PublicSearchStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Chunk-safe SSE reader. It accepts only known, schema-validated events.
 * Returns the unconsumed tail so split network chunks cannot lose a message.
 */
export function readPublicSearchStreamChunk(
  value: string,
): { events: PublicSearchStreamEvent[]; remainder: string } {
  const chunks = value.replace(/\r\n/g, "\n").split("\n\n");
  const remainder = chunks.pop() ?? "";
  const events: PublicSearchStreamEvent[] = [];
  for (const block of chunks) {
    const data = block.split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) continue;
    try {
      const parsed = publicSearchStreamEventSchema.safeParse(JSON.parse(data));
      if (parsed.success) events.push(parsed.data);
    } catch {
      // Never insert malformed or untrusted JSON into the transcript.
    }
  }
  return { events, remainder };
}

export type PublicStreamView = {
  requestId: string | null;
  status: "idle" | "streaming" | "completed" | "stopped" | "error";
  answer: string;
  sources: string[];
  results: z.infer<typeof hitSchema>[];
  spatialNote: string | null;
  warningMessages: string[];
  sourceState: "navigation_only" | "imported_provider_index" | "partial" | null;
};

export const initialPublicStreamView = (): PublicStreamView => ({
  requestId: null,
  status: "idle",
  answer: "",
  sources: [],
  results: [],
  spatialNote: null,
  warningMessages: [],
  sourceState: null,
});

/** One reducer is shared by list, chat and spatial-availability views. */
export function reducePublicStreamView(
  state: PublicStreamView,
  event: PublicSearchStreamEvent,
): PublicStreamView {
  switch (event.type) {
    case "search.started":
      return { ...initialPublicStreamView(), status: "streaming", requestId: event.requestId };
    case "source.found":
      return {
        ...state,
        sources: state.sources.includes(event.label)
          ? state.sources : [...state.sources, event.label],
      };
    case "result.upsert": {
      const index = state.results.findIndex((hit) => hit.id === event.result.id);
      const next = [...state.results];
      if (index < 0) next.push(event.result);
      else next[index] = event.result;
      return { ...state, results: next };
    }
    case "message.delta":
      return { ...state, answer: state.answer + event.text };
    case "spatial.updated":
      return { ...state, spatialNote: event.explanation };
    case "search.completed":
      return {
        ...state,
        status: "completed",
        sourceState: event.sourceState,
        warningMessages: event.warnings,
      };
    case "search.error":
      return { ...state, status: "error", warningMessages: [event.message] };
  }
}
