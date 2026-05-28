import { requireApiSession } from "@/lib/api/auth-handler";
import {
  assertParticipantAccess,
  ParticipantAccessError,
} from "@/lib/participant-needs/assert-participant-access";
import { buildParticipantNeedsSnapshot } from "@/lib/participant-needs/build-needs-snapshot";
import { needsSnapshotToWorkerFilters } from "@/lib/participant-needs/needs-to-worker-filters";
import { runWorkerSearchStream } from "@/lib/search/worker-search-stream-service";
import type { WorkerSearchFilters } from "@/lib/search/worker-search-types";

type WorkerSearchStreamRequest = {
  query?: string;
  filters?: WorkerSearchFilters;
  participantId?: string;
};

const encoder = new TextEncoder();

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: WorkerSearchStreamRequest;
  try {
    body = (await request.json()) as WorkerSearchStreamRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = body.query?.trim() ?? "";
  if (!query) {
    return Response.json(
      { error: "Please provide a search query." },
      { status: 400 },
    );
  }

  let mergedFilters: WorkerSearchFilters | undefined = body.filters;

  if (body.participantId) {
    try {
      assertParticipantAccess(user, body.participantId);
      const snapshot = await buildParticipantNeedsSnapshot(
        body.participantId,
        query,
      );
      if (snapshot) {
        mergedFilters = {
          ...needsSnapshotToWorkerFilters(snapshot),
          ...body.filters,
          query,
        };
      }
    } catch (e) {
      if (e instanceof ParticipantAccessError) {
        return Response.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writeEvent = (event: string, data: unknown) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        const result = await runWorkerSearchStream({
          query,
          filters: mergedFilters,
          onEvent: async (event) => {
            writeEvent("progress", event);
          },
        });

        writeEvent("result", result);
      } catch {
        writeEvent("error", {
          error: "Something went wrong during worker matching.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
