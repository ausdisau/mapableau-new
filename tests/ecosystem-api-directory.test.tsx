/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/certified-ecosystem/ecosystem-service", () => ({
  listPublicEcosystemDirectory: vi.fn(async () => []),
}));

import EcosystemApiDirectoryPage from "@/app/(core)/ecosystem/api-directory/page";

afterEach(() => cleanup());

describe("Certified API ecosystem directory", () => {
  it("renders the directory heading, disclaimer, and empty listing copy", async () => {
    const page = await EcosystemApiDirectoryPage();
    render(page);
    expect(
      screen.getByRole("heading", { name: /Certified API ecosystem/i }),
    ).toBeTruthy();
    expect(screen.getByText(/not regulatory certification/i)).toBeTruthy();
    expect(screen.getByText(/No ecosystem listings published/i)).toBeTruthy();
  });
});
