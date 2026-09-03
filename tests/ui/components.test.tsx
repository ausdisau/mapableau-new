/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ModuleCard, StatusChip, Timeline } from "@mapable/ui";

describe("@mapable/ui components", () => {
  it("renders ModuleCard with test id", () => {
    render(
      <ModuleCard
        title="Care"
        description="Manage support"
        eyebrow="Module"
      />,
    );
    expect(screen.getByTestId("mapable-module-card")).toBeTruthy();
    expect(screen.getByText("Care")).toBeTruthy();
  });

  it("renders Timeline empty state", () => {
    render(<Timeline items={[]} emptyMessage="Nothing today" />);
    expect(screen.getByTestId("mapable-timeline-empty")).toBeTruthy();
    expect(screen.getByText("Nothing today")).toBeTruthy();
  });

  it("renders StatusChip with label", () => {
    render(<StatusChip label="confirmed" tone="success" />);
    expect(screen.getByTestId("mapable-status-chip")).toBeTruthy();
    expect(screen.getByText("confirmed")).toBeTruthy();
  });
});
