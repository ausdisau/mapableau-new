/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MapAbleStreamingWorkspace } from "@/components/search/MapAbleStreamingWorkspace";
import { createDefaultSearchSelection } from "@/lib/search/mapable-search-ui";
import { formatPublicSearchStreamEvent } from "@/lib/search/mapable-stream-contract";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), prefetch: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  mocks.push.mockClear();
});

describe("public streaming search workspace", () => {
  const selection = createDefaultSearchSelection({ presentation: "conversation" });

  it("starts with no request and no inferred profile or speculative map", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<MapAbleStreamingWorkspace initialSelection={selection} />);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Find what works for you." })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Skip to results" })).toBeTruthy();
    expect(screen.getByText(/does not use a generative AI model/i)).toBeTruthy();
    expect((screen.getByRole("button", { name: /2D Map · Unavailable/i }) as HTMLButtonElement).disabled)
      .toBe(true);
    expect((screen.getByRole("button", { name: /3D · Unavailable/i }) as HTMLButtonElement).disabled)
      .toBe(true);
  });

  it("requires explicit approval before streaming and synchronises messages and sourced results", async () => {
    const payload = [
      { type: "search.started" as const, requestId: "00000000-0000-4000-8000-000000000001" },
      { type: "source.found" as const, label: "MapAble public navigation" },
      {
        type: "result.upsert" as const,
        result: {
          id: "care",
          kind: "module" as const,
          vertical: "care" as const,
          title: "MapAble Care",
          description: "Public care explainer",
          href: "/care",
          provenance: "mapable_navigation" as const,
          sourceLabel: "MapAble public navigation",
          registration: "not_independently_verified" as const,
          workerScreening: "not_independently_verified" as const,
          accessFit: "unknown" as const,
          availability: "unknown" as const,
        },
      },
      { type: "message.delta" as const, text: "Review the public source before making a decision." },
      { type: "spatial.updated" as const, available: false as const, explanation: "No sourced coordinates." },
      {
        type: "search.completed" as const,
        resultCount: 1,
        sourceState: "navigation_only" as const,
        warnings: ["Current registration not verified."],
      },
    ].map(formatPublicSearchStreamEvent).join("");
    const fetchSpy = vi.fn().mockResolvedValue(new Response(payload, {
      headers: { "Content-Type": "text/event-stream" },
    }));
    vi.stubGlobal("fetch", fetchSpy);
    render(<MapAbleStreamingWorkspace initialSelection={selection} />);

    const input = screen.getByRole("searchbox", { name: /Search MapAble/i });
    fireEvent.change(input, { target: { value: "NDIS support" } });
    fireEvent.click(screen.getByRole("button", { name: "Search", exact: true }));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/Choose the public-search consent checkbox/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: /I choose to send my question/i }));
    fireEvent.click(screen.getByRole("button", { name: "Search", exact: true }));
    await waitFor(() => expect(screen.getByText(/Answer ready/i)).toBeTruthy());
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, options] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("/api/mapable-search/stream");
    expect(JSON.parse(options.body)).toMatchObject({
      message: "NDIS support", vertical: "all", publicSearchApproved: true,
    });
    expect(screen.getByText("Review the public source before making a decision.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "MapAble Care" })).toBeTruthy();
    expect(screen.getByText(/No sourced coordinates/)).toBeTruthy();
    expect(screen.getAllByText(/Not independently verified/i).length).toBeGreaterThan(0);
  });

  it("does not charge or send a request when Deep Search is selected", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<MapAbleStreamingWorkspace initialSelection={selection} />);
    fireEvent.change(screen.getByRole("searchbox", { name: /Search MapAble/i }), {
      target: { value: "Accessible workplaces" },
    });
    fireEvent.click(screen.getByLabelText("Deep · Credits"));
    fireEvent.click(screen.getByRole("checkbox", { name: /I choose to send my question/i }));
    fireEvent.click(screen.getByRole("button", { name: "Search", exact: true }));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/Deep Search is not active/i)).toBeTruthy();
  });
});
