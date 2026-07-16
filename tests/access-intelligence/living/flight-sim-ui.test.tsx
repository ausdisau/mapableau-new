/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => React.createElement("a", { href }, children),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));

describe("Interview flight sim UI smoke", () => {
  it("renders start control and Visit exit link", async () => {
    const { InterviewFlightSimClient } = await import(
      "@/components/access-intelligence/living/interview-flight-sim-client"
    );
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "The Interview on Level 3",
        humanGoal: "Taylor has an interview",
        fictionalNotice: "Fictional",
        requirements: [],
        evidenceCatalog: [],
      }),
    }) as unknown as typeof fetch;

    render(React.createElement(InterviewFlightSimClient));
    expect(
      await screen.findByRole("button", { name: /Start flight simulator/i }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: /Exit to Visit mode/i })).toBeTruthy();
  });
});
