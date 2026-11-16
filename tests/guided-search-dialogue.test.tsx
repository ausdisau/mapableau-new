/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";

import { GuidedSearchChoiceChips } from "@/components/guided-search/GuidedSearchChoiceChips";
import { GuidedSearchDialogue } from "@/components/guided-search/GuidedSearchDialogue";
import { applyChoiceToSession } from "@/components/guided-search/types";

const sendMessage = vi.fn();
const mockUseChat = vi.fn();

vi.mock("@ai-sdk/react", () => ({
  useChat: (...args: unknown[]) => mockUseChat(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/search/AccessibleAutocomplete", () => ({
  AccessibleAutocomplete: () => <div>location autocomplete</div>,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("GuidedSearchDialogue", () => {
  beforeEach(() => {
    mockUseChat.mockReturnValue({
      messages: [
        {
          id: "a1",
          role: "assistant",
          parts: [{ type: "text", text: "Which suburb should I search near?" }],
        },
      ],
      sendMessage,
      status: "ready",
      error: null,
    });
  });

  it("renders streaming assistant message and composer", () => {
    render(
      <GuidedSearchDialogue
        session={{
          query: "",
          location: "",
          providerName: "",
          serviceQuery: "",
          accessQuery: "",
        }}
        onInterpretation={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Which suburb should I search near?"),
    ).toBeTruthy();
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("maps service chip selection into session fields", () => {
    const session = {
      query: "help",
      location: "",
      providerName: "",
      serviceQuery: "",
      accessQuery: "",
    };

    expect(
      applyChoiceToSession(session, "service", "Transport").serviceQuery,
    ).toBe("Transport");
  });

  it("chip click invokes onSelect handler", () => {
    const onSelect = vi.fn();
    render(
      <GuidedSearchChoiceChips
        choices={[{ label: "Transport", value: "Transport" }]}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Transport" }));
    expect(onSelect).toHaveBeenCalledWith({
      label: "Transport",
      value: "Transport",
    });
  });

  it("offers Skip and Not sure without wiping other session fields", () => {
    const session = {
      query: "morning daily activities",
      location: "Penrith 2750",
      providerName: "",
      serviceQuery: "morning daily activities",
      accessQuery: "text communication",
    };

    const skipped = applyChoiceToSession(session, "access", "Not sure");
    expect(skipped.skippedSlots).toEqual(["access"]);
    expect(skipped.location).toBe("Penrith 2750");
    expect(skipped.serviceQuery).toBe("morning daily activities");
    expect(skipped.accessQuery).toBe("text communication");

    const onSelect = vi.fn();
    render(
      <GuidedSearchChoiceChips
        choices={[{ label: "Wheelchair access", value: "Wheelchair access" }]}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    fireEvent.click(screen.getByRole("button", { name: "Not sure" }));
    expect(onSelect).toHaveBeenCalledWith({ label: "Skip", value: "Skip" });
    expect(onSelect).toHaveBeenCalledWith({
      label: "Not sure",
      value: "Not sure",
    });
  });

  it("shows Skip on the location picker without inventing a suburb", async () => {
    let onData: ((part: { type: string; data?: unknown }) => void) | undefined;
    mockUseChat.mockImplementation(
      (opts: { onData?: (part: { type: string; data?: unknown }) => void }) => {
        onData = opts.onData;
        return {
          messages: [
            {
              id: "a1",
              role: "assistant",
              parts: [{ type: "text", text: "Which suburb should I search near?" }],
            },
          ],
          sendMessage,
          status: "ready",
          error: null,
        };
      },
    );

    const onSessionChange = vi.fn();
    render(
      <GuidedSearchDialogue
        session={{
          query: "morning daily activities",
          location: "Penrith 2750",
          providerName: "",
          serviceQuery: "morning daily activities",
          accessQuery: "text communication",
        }}
        onSessionChange={onSessionChange}
        onInterpretation={vi.fn()}
      />,
    );

    onData?.({
      type: "data-finderAgent",
      data: {
        sessionId: "finder-test",
        turnIndex: 1,
        status: "needs_clarification",
        clarificationSlot: "location",
        filledSlots: { service: true, access: true, location: false },
      },
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Skip" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onSessionChange).toHaveBeenCalled();
    const next = onSessionChange.mock.calls.at(-1)?.[0] as {
      skippedSlots?: string[];
      location: string;
      accessQuery: string;
    };
    expect(next.skippedSlots).toEqual(["location"]);
    expect(next.location).toBe("Penrith 2750");
    expect(next.accessQuery).toBe("text communication");
    expect(sendMessage).toHaveBeenCalled();
  });
});
