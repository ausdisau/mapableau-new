/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

import { VirtualPersonaWorkspace } from "@/components/virtual-persona/VirtualPersonaWorkspace";

describe("VirtualPersonaWorkspace accessibility semantics", () => {
  it("exposes labelled conversation, composer, and controls", () => {
    render(<VirtualPersonaWorkspace />);
    expect(
      screen.getByRole("heading", { name: "MapAble Guide" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Conversation" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Your message" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Your controls" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Stop" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Use non-AI alternative" }),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Message to MapAble Guide"),
    ).toBeTruthy();
  });
});
