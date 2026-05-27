import { requireApiSession } from "@/lib/api/auth-handler";
import { runWorkerSearchStream } from "@/lib/search/worker-search-stream-service";

type WorkerSearchStreamRequest = {
  query?: string;
  filters?: {
    serviceRegion?: string;
    serviceType?: string;
    wheelchairAccessible?: boolean;
    verificationStatus?: string;
    language?: string;
    organisationType?: string;
    query?: string;
  };
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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writeEvent = (event: string, data: unknown) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        const result = await runWorkerSearchStream({
          query,
          filters: body.filters,
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
