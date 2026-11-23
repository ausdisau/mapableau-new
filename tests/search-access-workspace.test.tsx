/** @vitest-environment jsdom */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SearchWorkspace } from "@/components/search/workspace/SearchWorkspace";
import {
  comparison,
  directoryUrl,
  initialState,
  isLocalPath,
  parseWidth,
  reduceSearch,
  selectedClinic,
  visibleClinics,
} from "@/mobile-contracts/search/workspace";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("accessible search workspace", () => {
  it("opens the synthetic example deliberately and preserves the AAC draft between all three views", () => {
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    render(<SearchWorkspace />);
    expect(
      screen.queryByText("St Ives Allied Health Hub", { exact: false }),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Open synthetic example" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Step-free trip" }));
    const composer = screen.getByLabelText(
      "Ask MapAble",
    ) as HTMLTextAreaElement;
    expect(document.activeElement).toBe(composer);
    expect(composer.value).toBe("Step-free trip");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Select clinic 2, Ku-ring-gai Rehab Clinic",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "3D floor plan" }),
    );
    expect(screen.getByText(/No plan supplied for clinic 2/)).toBeTruthy();
    expect(screen.queryByAltText(/Illustrative cutaway/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "List" }));
    fireEvent.click(screen.getByRole("button", { name: "Web" }));
    expect(composer.value).toBe("Step-free trip");
    expect(request).not.toHaveBeenCalled();
  });
  it("recomputes results and selection after changing or withdrawing a minimum", () => {
    let s = reduceSearch(initialState, { type: "example" });
    s = reduceSearch(s, { type: "minimum", value: 930 });
    s = reduceSearch(s, { type: "alternatives", value: false });
    expect(visibleClinics(s)).toEqual([]);
    expect(selectedClinic(s)).toBeUndefined();
    s = reduceSearch(s, { type: "minimum", value: 900 });
    expect(visibleClinics(s).map((c) => c.id)).toEqual([1]);
    s = reduceSearch(s, { type: "minimum", value: null });
    expect(visibleClinics(s)).toHaveLength(2);
    expect(comparison(920, 920)).toBe("Exactly your minimum");
    expect(["", "0", "92.5", "-9", "900mm", "10000"].map(parseWidth)).toEqual(
      Array(6).fill(undefined),
    );
  });
  it("sends only a public category, rejects external destinations and recovers after an error", async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              title: "Jobs",
              href: "/employment",
              sourceLabel: "MapAble navigation",
            },
            {
              title: "Discard",
              href: "//other.example",
              sourceLabel: "unknown",
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", request);
    render(<SearchWorkspace />);
    fireEvent.change(screen.getByLabelText("Ask MapAble"), {
      target: { value: "I want employment near my private address" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    expect(
      (
        await screen.findByRole("link", { name: "Jobs" })
      ).getAttribute("href"),
    ).toBe("/employment");
    expect(request.mock.calls.map((c) => c[0])).toEqual(
      Array(2).fill("/api/mapable-search?vertical=jobs"),
    );
    expect(screen.queryByText("Discard")).toBeNull();
    expect(directoryUrl("Places")).toContain("vertical=places");
    expect(isLocalPath("https://elsewhere.example")).toBe(false);
  });
  it("ignores late directory replies and clears the optional support note when clearing all data", async () => {
    let finish: (data: unknown) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      ),
    );
    render(<SearchWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "Web" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Open synthetic example" }),
    );
    finish({
      ok: true,
      json: async () => ({
        results: [
          { title: "Stale result", href: "/care", sourceLabel: "Directory" },
        ],
      }),
    });
    await waitFor(() =>
      expect(screen.getByText("Access near St Ives")).toBeTruthy(),
    );
    expect(screen.queryByText("Stale result")).toBeNull();
    const note = screen.getByLabelText(
      "Optional note for the contact team",
    ) as HTMLTextAreaElement;
    fireEvent.change(note, { target: { value: "Private note" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Leave example and clear search" }),
    );
    expect(note.value).toBe("");
    expect(
      screen.getByRole("button", { name: "Open synthetic example" }),
    ).toBeTruthy();
  });
});
