import { requireApiSession } from "@/lib/api/auth-handler";
import {
  assertParticipantAccess,
  ParticipantAccessError,
} from "@/lib/participant-needs/assert-participant-access";
import { runNeedsAssessmentStream } from "@/lib/participant-needs/needs-assessment-stream-service";

type RouteParams = { params: Promise<{ id: string }> };

type AssessStreamRequest = {
  query?: string;
};

const encoder = new TextEncoder();

export async function POST(request: Request, { params }: RouteParams) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id: participantId } = await params;

  try {
    assertParticipantAccess(user, participantId);
  } catch (e) {
    if (e instanceof ParticipantAccessError) {
      return Response.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  let body: AssessStreamRequest = {};
  try {
    body = (await request.json()) as AssessStreamRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writeEvent = (event: string, data: unknown) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        const result = await runNeedsAssessmentStream({
          participantId,
          query: body.query,
          onEvent: async (event) => {
            writeEvent("progress", event);
          },
        });

        writeEvent("result", result);
      } catch (error) {
        writeEvent("error", {
          error:
            error instanceof Error
              ? error.message
              : "Something went wrong during needs assessment.",
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
