// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MarketplaceEvidencePreview } from "../components/marketplace/MarketplaceEvidencePreview";

afterEach(cleanup);

describe("Marketplace evidence preview participant interactions", () => {
  it("keeps demo and no-payment disclosures visible and labels search controls", () => {
    render(<MarketplaceEvidencePreview />);
    expect(screen.getByRole("heading", { name: "Better information before you buy." })).toBeTruthy();
    expect(screen.getByText(/All listings, suppliers and prices are synthetic/)).toBeTruthy();
    expect(screen.getByRole("searchbox", { name: "Search examples" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Category" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Condition" })).toBeTruthy();
    const download = screen.getByRole("button", { name: "Download local text draft" });
    expect(download.hasAttribute("disabled")).toBe(true);
  });

  it("filters examples by accessible search and preserves an empty-state recovery", () => {
    render(<MarketplaceEvidencePreview />);
    const search = screen.getByRole("searchbox", { name: "Search examples" });
    fireEvent.change(search, { target: { value: "AAC" } });
    expect(screen.getByText(/2 synthetic example listings shown/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Portable communication board" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tablet and access-switch mount" })).toBeTruthy();
    fireEvent.change(search, { target: { value: "not a real product" } });
    expect(screen.getByText(/No example items match/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText(/6 synthetic example listings shown/)).toBeTruthy();
  });

  it("uses item-specific names for comparison and local draft without processing payment", () => {
    render(<MarketplaceEvidencePreview />);
    const compare = screen.getByRole("button", { name: "Compare Portable communication board" });
    fireEvent.click(compare);
    expect(screen.getByRole("table", { name: /Side-by-side evidence/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove Portable communication board from comparison" })).toBeTruthy();
    const restricted = screen.getByRole("button", { name: "Adjustable soft-light lamp needs specialist review" });
    expect(restricted.hasAttribute("disabled")).toBe(true);
    const add = screen.getByRole("button", { name: "Add Portable communication board to local draft" });
    fireEvent.click(add);
    expect(screen.getByRole("button", { name: "Remove Portable communication board from local draft" })).toBeTruthy();
    const download = screen.getByRole("button", { name: "Download local text draft" });
    expect(download.hasAttribute("disabled")).toBe(false);
  });

  it("applies the larger-text mode to the component subtree and controls", () => {
    const { container } = render(<MarketplaceEvidencePreview />);
    const button = screen.getByRole("button", { name: "Use larger text" });
    fireEvent.click(button);
    expect(container.querySelector('[data-text-size="large"]')).toBeTruthy();
    expect(screen.getByRole("button", { name: "Use standard text size" })).toBeTruthy();
  });
});
