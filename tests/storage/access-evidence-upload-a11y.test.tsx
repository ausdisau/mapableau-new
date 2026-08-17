/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { AccessEvidencePhotoContribute } from "@/components/access/AccessEvidencePhotoContribute";

afterEach(() => {
  cleanup();
});

describe("AccessEvidencePhotoContribute accessibility", () => {
  it("exposes labelled file control, formats, and a non-drag path", () => {
    render(
      <AccessEvidencePhotoContribute placeId="place_abc123" maxUploadMb={10} />,
    );

    expect(
      screen.getByRole("heading", { name: /add photo evidence/i }),
    ).toBeTruthy();
    const file = screen.getByLabelText(/^photo$/i);
    expect(file.tagName).toBe("INPUT");
    expect(file.getAttribute("type")).toBe("file");
    expect(file.getAttribute("accept")).toContain("image/jpeg");
    expect(
      screen.getByText(/Accepted formats: JPEG, PNG, WebP/i),
    ).toBeTruthy();
    expect(screen.getByText(/Maximum size 10 MB/i)).toBeTruthy();
    expect(
      screen.getByText(/Drag-and-drop is not required/i),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /upload photo evidence/i }),
    ).toBeTruthy();
  });

  it("announces errors through an alert when no file is chosen", async () => {
    const user = userEvent.setup();
    render(
      <AccessEvidencePhotoContribute placeId="place_abc123" maxUploadMb={10} />,
    );
    await user.type(
      screen.getByLabelText(/access feature/i),
      "entrance.step_free",
    );
    await user.click(
      screen.getByRole("button", { name: /upload photo evidence/i }),
    );
    expect(screen.getByRole("alert").textContent).toMatch(/file picker/i);
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("supports keyboard operation of the file input", async () => {
    const user = userEvent.setup();
    render(
      <AccessEvidencePhotoContribute placeId="place_abc123" maxUploadMb={10} />,
    );
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByLabelText(/access feature/i),
    );
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText(/notes/i));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText(/^photo$/i));
  });
});
