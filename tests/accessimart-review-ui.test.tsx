/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { AccessiMartReviewCatalogue } from "@/components/marketplace/accessimart-review/AccessiMartReviewCatalogue";
import { ACCESSIMART_SYNTHETIC_CATALOGUE } from "@/lib/marketplace/accessimart-synthetic-catalogue";

afterEach(() => cleanup());

describe("AccessiMart review UI", () => {
  it("filters listings and keeps commerce disabled messaging", async () => {
    const user = userEvent.setup();
    render(<AccessiMartReviewCatalogue listings={ACCESSIMART_SYNTHETIC_CATALOGUE} />);

    expect(
      screen.getByText(/Checkout, quotes and seller contact are disabled/i),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Show filters/i }));
    await user.selectOptions(screen.getByLabelText(/Category/i), "communication");

    expect(
      screen.getByRole("heading", {
        name: /AAC communication board pack \(example\)/i,
      }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", {
        name: /Lightweight folding manual wheelchair/i,
      }),
    ).toBeNull();
  });
});
