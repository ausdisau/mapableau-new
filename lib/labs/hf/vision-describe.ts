import {
  DEFAULT_LABS_VISION_PROMPT,
  getLabsHfToken,
  getLabsVisionModel,
  HF_ROUTER_BASE_URL,
} from "@/lib/labs/hf/config";

export type LabsVisionDescribeInput = {
  prompt?: string;
  imageUrl: string;
  /** Injected for tests */
  fetchImpl?: typeof fetch;
  token?: string | null;
  model?: string;
};

export class LabsHfConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LabsHfConfigError";
  }
}

export class LabsHfUpstreamError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "LabsHfUpstreamError";
    this.status = status;
  }
}

/**
 * Streams assistant text deltas from HF Router chat.completions (vision).
 * Returns a ReadableStream of UTF-8 text chunks (not SSE) for simple UI consumption.
 */
export async function streamLabsVisionDescribe(
  input: LabsVisionDescribeInput,
): Promise<ReadableStream<Uint8Array>> {
  const token = input.token === undefined ? getLabsHfToken() : input.token;
  if (!token) {
    throw new LabsHfConfigError(
      "HF_TOKEN is not configured. Labs vision probe cannot call Hugging Face.",
    );
  }

  const prompt = (input.prompt?.trim() || DEFAULT_LABS_VISION_PROMPT).slice(
    0,
    500,
  );
  const imageUrl = input.imageUrl.trim();
  if (!isAllowedLabsImageUrl(imageUrl)) {
    throw new LabsHfConfigError(
      "imageUrl must be an https URL or a data:image/* URL under size limits.",
    );
  }

  const model = input.model ?? getLabsVisionModel();
  const fetchImpl = input.fetchImpl ?? fetch;

  const upstream = await fetchImpl(`${HF_ROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    throw new LabsHfUpstreamError(
      detail.slice(0, 400) || `Hugging Face router error (${upstream.status})`,
      upstream.status,
    );
  }

  return transformOpenAiSseToText(upstream.body);
}

/** Allow https images or modest data:image payloads (no http). */
export function isAllowedLabsImageUrl(url: string): boolean {
  if (url.startsWith("https://") && url.length <= 2048) return true;
  if (url.startsWith("data:image/")) {
    // ~1.5MB base64 ceiling for Labs demos
    return url.length <= 2_000_000;
  }
  return false;
}

export function transformOpenAiSseToText(
  body: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string | null } }>;
              };
              const piece = parsed.choices?.[0]?.delta?.content;
              if (piece) controller.enqueue(encoder.encode(piece));
            } catch {
              // skip malformed SSE frames
            }
          }
        }
      } catch (err) {
        controller.error(err);
        return;
      } finally {
        reader.releaseLock();
      }
      controller.close();
    },
  });
}
