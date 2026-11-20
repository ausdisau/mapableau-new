/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/certified-ecosystem/ecosystem-service", () => ({
  listPublicEcosystemDirectory: vi.fn(async () => []),
}));

import CertifiedApiEcosystemPage from "@/app/(core)/certified-api-ecosystem/page";

afterEach(() => cleanup());

describe("Certified API ecosystem directory", () => {
  it("renders heading, disclaimer, and empty-state copy accessibly", async () => {
    render(await CertifiedApiEcosystemPage());
    expect(
      screen.getByRole("heading", { level: 1, name: /Certified API ecosystem/i }),
    ).toBeTruthy();
    expect(screen.getByText(/not regulatory certification/i)).toBeTruthy();
    expect(screen.getByText(/No ecosystem listings published/i)).toBeTruthy();
    // Empty state must not be a list item inside an empty list (WCAG 1.3.1).
    expect(document.querySelector("ul")).toBeNull();
  });
});
