import { Output, streamText } from "ai";

import { getGatewayModel } from "@/lib/ai/gateway-model";
import { cocktailsListSchema } from "@/lib/ai/stream-object-schema";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const context =
      typeof body === "string"
        ? body
        : typeof body?.prompt === "string"
          ? body.prompt
          : JSON.stringify(body);

    const result = streamText({
      model: getGatewayModel("openai/gpt-4.1-mini"),
      output: Output.object({ schema: cocktailsListSchema }),
      prompt: `Generate a list of cocktails in this context: ${context}`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stream object generation failed";
    return Response.json({ error: message }, { status: 503 });
  }
}
