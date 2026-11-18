/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CartographyControls } from "@/app/pilot/service-cartography/CartographyControls";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CartographyControls", () => {
  it("re-enables simulation buttons after a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    render(<CartographyControls />);
    fireEvent.click(screen.getByTestId("run-baseline-simulate"));
    await waitFor(() => {
      expect(screen.getByTestId("simulate-result").textContent).toMatch(
        /network down/i,
      );
    });
    expect(
      (screen.getByTestId("run-baseline-simulate") as HTMLButtonElement).disabled,
    ).toBe(false);
  });
});
