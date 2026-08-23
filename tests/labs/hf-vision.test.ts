import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_LABS_HF_VISION_MODEL,
  HF_ROUTER_BASE_URL,
  isAllowedLabsImageUrl,
  LabsHfConfigError,
  streamLabsVisionDescribe,
  transformOpenAiSseToText,
} from "@/lib/labs/hf";

describe("Labs HF vision helpers", () => {
  it("allows https and data image URLs only", () => {
    expect(isAllowedLabsImageUrl("https://example.com/a.jpg")).toBe(true);
    expect(isAllowedLabsImageUrl("http://example.com/a.jpg")).toBe(false);
    expect(isAllowedLabsImageUrl("data:image/png;base64,abc")).toBe(true);
    expect(isAllowedLabsImageUrl("ftp://example.com/a.jpg")).toBe(false);
  });

  it("transforms OpenAI SSE frames into plain text", async () => {
    const sse = [
      'data: {"choices":[{"delta":{"content":"Hello "}}]}\n',
      'data: {"choices":[{"delta":{"content":"world"}}]}\n',
      "data: [DONE]\n",
    ].join("");
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sse));
        controller.close();
      },
    });

    const out = transformOpenAiSseToText(body);
    const text = await new Response(out).text();
    expect(text).toBe("Hello world");
  });

  it("requires HF token", async () => {
    await expect(
      streamLabsVisionDescribe({
        imageUrl: "https://example.com/a.jpg",
        token: null,
      }),
    ).rejects.toBeInstanceOf(LabsHfConfigError);
  });

  it("posts OpenAI-compatible vision payload to HF Router", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(
              new TextEncoder().encode(
                'data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n',
              ),
            );
            c.close();
          },
        }),
        { status: 200 },
      ),
    );

    const stream = await streamLabsVisionDescribe({
      imageUrl: "https://example.com/a.jpg",
      prompt: "Describe this image in one sentence.",
      token: "hf_test",
      model: DEFAULT_LABS_HF_VISION_MODEL,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(await new Response(stream).text()).toBe("ok");
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(`${HF_ROUTER_BASE_URL}/chat/completions`);
    expect(init.headers.Authorization).toBe("Bearer hf_test");
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe(DEFAULT_LABS_HF_VISION_MODEL);
    expect(body.stream).toBe(true);
    expect(body.messages[0].content).toEqual([
      { type: "text", text: "Describe this image in one sentence." },
      {
        type: "image_url",
        image_url: { url: "https://example.com/a.jpg" },
      },
    ]);
  });
});
