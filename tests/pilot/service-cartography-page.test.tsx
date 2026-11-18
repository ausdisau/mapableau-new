/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

import ServiceCartographyPilotPage from "@/app/pilot/service-cartography/page";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Service Cartography pilot page", () => {
  it("shows disabled copy when the flag is off", async () => {
    vi.stubEnv("MAPABLE_SERVICE_CARTOGRAPHY_PILOT", "false");
    const ui = await ServiceCartographyPilotPage();
    render(ui);
    expect(screen.getByText(/Pilot is disabled/i)).toBeTruthy();
  });

  it("refuses the preview when synthetic-only is turned off", async () => {
    vi.stubEnv("MAPABLE_SERVICE_CARTOGRAPHY_PILOT", "true");
    vi.stubEnv("MAPABLE_SERVICE_CARTOGRAPHY_SYNTHETIC_ONLY", "false");
    const ui = await ServiceCartographyPilotPage();
    render(ui);
    expect(screen.getByText(/Synthetic-only mode is required/i)).toBeTruthy();
  });

  it("renders advisory-only honesty copy when enabled", async () => {
    vi.stubEnv("MAPABLE_SERVICE_CARTOGRAPHY_PILOT", "true");
    vi.stubEnv("MAPABLE_SERVICE_CARTOGRAPHY_SYNTHETIC_ONLY", "true");
    const ui = await ServiceCartographyPilotPage();
    render(ui);
    expect(screen.getByTestId("honesty-line").textContent).toMatch(/isBooking=false/);
    expect(screen.getByTestId("matching-status").textContent).toMatch(
      /advisory_options/,
    );
    expect(screen.getByTestId("ranked-options").querySelectorAll("li")).toHaveLength(
      2,
    );
    expect(screen.getByTestId("missing-dependencies").textContent).toMatch(
      /personal-care-fallback/,
    );
    expect(screen.getByTestId("advisory-meta").textContent).toMatch(/advisory_only/);
    expect(screen.queryByRole("button", { name: /book/i })).toBeNull();
  });
});
