/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { QuickObservationDialog } from "@/components/accessibility-map/QuickObservationDialog";

describe("MapAble Access authoring — ATAG-informed checks", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("provides an accessible labelled authoring dialog and review-before-submit flow", async () => {
    const user = userEvent.setup();
    render(
      <QuickObservationDialog
        place={{ id: "place-1", name: "Example Library" }}
        onClose={vi.fn()}
        onSubmitted={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: /report a change/i });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText(/evidence for review/i)).toBeTruthy();

    const entrance = screen.getByRole("radio", {
      name: /entrance|step|access/i,
    });
    await user.click(entrance);

    const continueButton = screen.getByRole("button", { name: /continue/i });
    expect(continueButton.hasAttribute("disabled")).toBe(false);
    await user.click(continueButton);

    const note = screen.getByRole("textbox", { name: /optional note/i });
    await user.type(note, "Temporary access change observed today.");
    await user.click(screen.getByRole("button", { name: /review/i }));

    expect(screen.getByText(/temporary access change observed today/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /submit observation/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /back/i })).toBeTruthy();
  });

  it("announces submission failures without discarding the authored review state", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Submission unavailable" }),
      }),
    );

    render(
      <QuickObservationDialog
        place={{ id: "place-1", name: "Example Library" }}
        onClose={vi.fn()}
        onSubmitted={vi.fn()}
      />,
    );

    const firstOption = screen.getAllByRole("radio")[0];
    await user.click(firstOption);
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /review/i }));
    await user.click(screen.getByRole("button", { name: /submit observation/i }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Submission unavailable",
    );
    expect(screen.getByRole("button", { name: /submit observation/i })).toBeTruthy();
  });
});
