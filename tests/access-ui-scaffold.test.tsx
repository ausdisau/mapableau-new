/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { AccessUIScaffold } from "@/components/access/AccessUIScaffold";

describe("AccessUIScaffold", () => {
  afterEach(() => cleanup());

  it("labels scaffold data honestly and keeps unknown evidence distinct", () => {
    render(<AccessUIScaffold />);

    expect(
      screen.getByRole("heading", {
        name: /find places that fit your access requirements/i,
      }),
    ).toBeTruthy();
    expect(screen.getByText(/prototype data/i)).toBeTruthy();
    expect(screen.getByText(/unknown evidence stays unknown/i)).toBeTruthy();
  });

  it("filters by capital city and preserves map/list result parity", async () => {
    const user = userEvent.setup();
    render(<AccessUIScaffold />);

    await user.selectOptions(screen.getByLabelText(/capital city/i), "Darwin");
    expect(screen.getByText(/1 place/i)).toBeTruthy();
    expect(screen.getByText("Waterfront Community Pavilion")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Map" }));
    expect(
      screen.getByRole("region", { name: /scaffold map presentation/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: /select waterfront community pavilion, darwin/i,
      }),
    ).toBeTruthy();
  });

  it("lets users set functional requirements without hiding unknown places", async () => {
    const user = userEvent.setup();
    render(<AccessUIScaffold />);

    await user.selectOptions(screen.getByLabelText(/capital city/i), "Darwin");
    await user.click(screen.getByRole("button", { name: "Hearing" }));

    expect(screen.getByText("Waterfront Community Pavilion")).toBeTruthy();
    expect(screen.getAllByText("Unknown").length).toBeGreaterThan(0);
  });
});
