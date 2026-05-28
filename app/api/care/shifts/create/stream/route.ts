import { requireApiPermission } from "@/lib/api/auth-handler";
import { runShiftCreatorStream } from "@/lib/care/shift-creator/shift-creator-stream-service";

type ShiftCreatorStreamRequest = {
  query?: string;
  careBookingId?: string;
};

const encoder = new TextEncoder();

export async function POST(request: Request) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;

  let body: ShiftCreatorStreamRequest;
  try {
    body = (await request.json()) as ShiftCreatorStreamRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = body.query?.trim() ?? "";
  if (!query) {
    return Response.json(
      { error: "Please describe the shift you want to schedule." },
      { status: 400 },
    );
  }

  const careBookingId =
    typeof body.careBookingId === "string" ? body.careBookingId.trim() : undefined;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writeEvent = (event: string, data: unknown) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        const result = await runShiftCreatorStream({
          query,
          careBookingId: careBookingId || undefined,
          actorUser: user,
          onEvent: async (event) => {
            writeEvent("progress", event);
          },
        });

        writeEvent("result", result);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Something went wrong while planning the shift.";
        writeEvent("error", { error: message });
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
