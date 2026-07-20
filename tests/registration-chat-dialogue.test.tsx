/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";

import { RegistrationChatDialogue } from "@/components/registration/RegistrationChatDialogue";
import { applySlotToSession } from "@/components/registration/types";

const sendMessage = vi.fn();
const mockUseChat = vi.fn();

vi.mock("@ai-sdk/react", () => ({
  useChat: (...args: unknown[]) => mockUseChat(...args),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RegistrationChatDialogue", () => {
  beforeEach(() => {
    mockUseChat.mockReturnValue({
      messages: [
        {
          id: "a1",
          role: "assistant",
          parts: [{ type: "text", text: "What is your full name?" }],
        },
      ],
      sendMessage,
      status: "ready",
      error: null,
    });
  });

  it("renders assistant message and composer", () => {
    render(<RegistrationChatDialogue />);

    expect(screen.getByText("What is your full name?")).toBeTruthy();
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("maps name slot into session fields", () => {
    const session = { name: "", email: "", password: "" };
    expect(applySlotToSession(session, "name", "Alex").name).toBe("Alex");
  });

});
