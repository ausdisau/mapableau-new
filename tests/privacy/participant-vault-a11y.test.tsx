/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { ParticipantInformationVault } from "@/components/privacy/ParticipantInformationVault";

afterEach(() => {
  cleanup();
});

describe("ParticipantInformationVault accessibility", () => {
  it("exposes labelled file control, formats, and a non-drag path", () => {
    render(
      <ParticipantInformationVault
        initialItems={[]}
        uploadsAvailable
        maxUploadMb={10}
      />,
    );

    expect(screen.getByRole("heading", { name: /add a file/i })).toBeTruthy();
    const file = screen.getByLabelText(/^file$/i);
    expect(file.tagName).toBe("INPUT");
    expect(file.getAttribute("type")).toBe("file");
    expect(file.getAttribute("accept")).toContain("application/pdf");
    expect(file.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText(/Accepted formats: PDF, JPEG, PNG, plain text/i)).toBeTruthy();
    expect(screen.getByText(/Maximum size 10 MB/i)).toBeTruthy();
    expect(screen.getByText(/Drag-and-drop is not required/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /add to vault/i })).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("announces errors through an alert when no file is chosen", async () => {
    const user = userEvent.setup();
    render(
      <ParticipantInformationVault
        initialItems={[]}
        uploadsAvailable
        maxUploadMb={10}
      />,
    );
    await user.click(screen.getByRole("button", { name: /add to vault/i }));
    expect(screen.getByRole("alert").textContent).toMatch(/file picker/i);
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("supports keyboard operation of the file input", async () => {
    const user = userEvent.setup();
    render(
      <ParticipantInformationVault
        initialItems={[]}
        uploadsAvailable
        maxUploadMb={10}
      />,
    );
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText(/^type$/i));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText(/label \(optional\)/i));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText(/^file$/i));
  });
});
