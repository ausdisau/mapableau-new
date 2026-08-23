/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VisionProbeExperiment } from "@/components/labs/VisionProbeExperiment";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("VisionProbeExperiment", () => {
  it("exposes labelled prompt and image controls", () => {
    render(<VisionProbeExperiment />);
    expect(screen.getByRole("heading", { name: "Vision Probe" })).toBeTruthy();
    expect(screen.getByLabelText("Prompt")).toBeTruthy();
    expect(screen.getByLabelText(/Image URL/i)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Describe image/i }),
    ).toBeTruthy();
  });

  it("streams description text into a live status region", async () => {
    const chunks = ["The ", "statue ", "stands tall."];
    let i = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (i >= chunks.length) {
          controller.close();
          return;
        }
        controller.enqueue(new TextEncoder().encode(chunks[i]!));
        i += 1;
      },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        }),
      ),
    );

    render(<VisionProbeExperiment />);
    fireEvent.click(screen.getByRole("button", { name: /Describe image/i }));

    expect(
      await screen.findByText("The statue stands tall."),
    ).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("statue");
  });
});
