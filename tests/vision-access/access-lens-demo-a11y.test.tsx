/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { AccessLensSyntheticDemo } from "@/components/access-lens/AccessLensSyntheticDemo";
import { VisionCandidateList } from "@/components/access-lens/VisionCandidateList";
import {
  VISION_ACCESS_SYNTHETIC_BANNER,
  getSortedCandidates,
} from "@/lib/vision-access";

afterEach(() => {
  cleanup();
});

describe("Access Lens synthetic demo accessibility smoke", () => {
  it("shows synthetic banner and list-first candidates", () => {
    render(<AccessLensSyntheticDemo />);

    expect(
      screen.getAllByText(VISION_ACCESS_SYNTHETIC_BANNER).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { name: /Entrance B/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /Candidate list/i }),
    ).toBeTruthy();
    expect(screen.getAllByText(/Entrance B candidate/i).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText(/Temporary barrier candidate/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Unavailable \(not a certified measurement\)/i)
        .length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/getUserMedia/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /upload/i })).toBeNull();
  });

  it("renders list with listitem entries for every candidate", () => {
    const candidates = getSortedCandidates();
    render(<VisionCandidateList candidates={candidates} />);
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(candidates.length);
  });

  it("marks decorative preview with accessible summary label", () => {
    render(<AccessLensSyntheticDemo />);
    expect(
      screen.getByRole("img", {
        name: /Synthetic phone preview for Harbour Civic Centre/i,
      }),
    ).toBeTruthy();
  });
});
