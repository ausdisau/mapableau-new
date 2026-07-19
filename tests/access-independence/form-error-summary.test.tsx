/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { FormErrorSummary } from "@/components/forms/FormErrorSummary";

describe("FormErrorSummary", () => {
  afterEach(() => {
    cleanup();
  });

  it("links error messages to field ids", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <FormErrorSummary
          errors={[{ id: "care-title", message: "Enter a title" }]}
        />
        <input id="care-title" aria-label="Title" />
      </div>,
    );

    const link = screen.getByRole("link", { name: /enter a title/i });
    expect(link.getAttribute("href")).toBe("#care-title");
    await user.click(link);
    expect(document.activeElement).toBe(screen.getByLabelText("Title"));
  });
});
