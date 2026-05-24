/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  MapAccessibleResultsList,
  type MapAccessibleResultItem,
} from "@/components/map/MapAccessibleResultsList";

const items: MapAccessibleResultItem[] = [
  {
    id: "p1",
    title: "Accessible Physio",
    subtitle: "Parramatta NSW",
    kind: "provider",
    isVerified: true,
    statusText: "Verified profile",
  },
  {
    id: "ad1",
    title: "Sponsored Clinic",
    subtitle: "Paid placement",
    kind: "sponsored",
    isSponsored: true,
    isVerified: true,
    statusText: "Verified sponsor",
  },
];

describe("MapAccessibleResultsList", () => {
  it("renders accessible list equivalent", () => {
    render(
      <MapAccessibleResultsList
        items={items}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("region", { name: "Map results list" })).toBeTruthy();
    expect(screen.getByText("Accessible Physio")).toBeTruthy();
    expect(screen.getByLabelText("Sponsored")).toBeTruthy();
  });
});
