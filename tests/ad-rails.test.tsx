/**
 * @vitest-environment jsdom
 */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdRailLayout } from "@/components/ads/AdRailLayout";
import { SkyscraperAdSlot } from "@/components/ads/SkyscraperAdSlot";
import {
  isEligibleAdRoute,
  isSensitiveRoute,
} from "@/lib/ads/ad-page-eligibility";
import { FORBIDDEN_TARGETING_FIELDS } from "@/lib/ads/ad-slot-policy";
import { shouldRecordImpression } from "@/lib/ads/ad-impression-service";

const mockPathname = vi.fn(() => "/provider-finder");

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("ad page eligibility", () => {
  it("allows public provider finder", () => {
    expect(isEligibleAdRoute("/provider-finder")).toBe(true);
    expect(isSensitiveRoute("/provider-finder")).toBe(false);
  });

  it("blocks login and onboarding", () => {
    expect(isEligibleAdRoute("/login")).toBe(false);
    expect(isSensitiveRoute("/login")).toBe(true);
    expect(isEligibleAdRoute("/onboarding/role")).toBe(false);
  });

  it("blocks dashboard and payment routes", () => {
    expect(isEligibleAdRoute("/dashboard")).toBe(false);
    expect(isSensitiveRoute("/billing")).toBe(true);
    expect(isSensitiveRoute("/checkout")).toBe(true);
  });
});

describe("AdRailLayout", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn(function IntersectionObserver(this: IntersectionObserver) {
        this.observe = vi.fn();
        this.disconnect = vi.fn();
        this.unobserve = vi.fn();
        return this;
      }),
    );
    mockPathname.mockReturnValue("/provider-finder");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          slot: {
            slotId: "skyscraper-left",
            status: "filled",
            creative: {
              id: "demo",
              title: "Test ad",
              href: "/provider-finder",
              width: 160,
              height: 600,
            },
          },
        }),
      })),
    );
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("min-width"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it("renders sponsored label in skyscraper slot", async () => {
    render(
      <AdRailLayout>
        <h1>Main content</h1>
      </AdRailLayout>,
    );
    expect(screen.getByRole("heading", { name: "Main content" })).toBeTruthy();
    await waitFor(() => {
      expect(screen.getAllByText(/Sponsored/i).length).toBeGreaterThan(0);
    });
  });

  it("skips rails on sensitive route", () => {
    mockPathname.mockReturnValue("/login");
    const { container } = render(
      <AdRailLayout>
        <h1>Sign in</h1>
      </AdRailLayout>,
    );
    expect(screen.queryByLabelText("Sponsored content")).toBeNull();
    expect(container.querySelectorAll("aside").length).toBe(0);
  });

  it("uses aside with accessible label", async () => {
    render(<SkyscraperAdSlot slotId="skyscraper-left" side="left" pageContext="provider-finder" />);
    const aside = await screen.findByLabelText("Sponsored content");
    expect(aside.tagName).toBe("ASIDE");
  });
});

describe("ad impression idempotency", () => {
  it("records impression only once per session", () => {
    expect(shouldRecordImpression("slot-a", "home")).toBe(true);
    expect(shouldRecordImpression("slot-a", "home")).toBe(false);
  });
});

describe("privacy-safe targeting", () => {
  it("documents forbidden targeting fields", () => {
    expect(FORBIDDEN_TARGETING_FIELDS).toContain("diagnosis");
    expect(FORBIDDEN_TARGETING_FIELDS).toContain("ndisNumber");
  });
});

describe("ad click tracking", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockPathname.mockReturnValue("/provider-finder");
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn(function IntersectionObserver(this: IntersectionObserver) {
        this.observe = vi.fn();
        this.disconnect = vi.fn();
        this.unobserve = vi.fn();
        return this;
      }),
    );
  });

  it("fires click event on ad link activation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("/api/ads/slots")) {
          return {
            ok: true,
            json: async () => ({
              slot: {
                slotId: "skyscraper-right",
                status: "filled",
                creative: {
                  id: "c1",
                  title: "Sponsored transport",
                  href: "https://example.com",
                  width: 160,
                  height: 600,
                },
              },
            }),
          };
        }
        return { ok: true, json: async () => ({ ok: true }) };
      }),
    );

    render(
      <SkyscraperAdSlot slotId="skyscraper-right" side="right" pageContext="provider-finder" />,
    );

    const link = await screen.findByRole("link", {
      name: /Sponsored: Sponsored transport/i,
    });
    fireEvent.click(link);

    await waitFor(() => {
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
      const eventCalls = calls.filter((c) =>
        String(c[0]).includes("/api/ads/events"),
      );
      expect(eventCalls.length).toBeGreaterThan(0);
      const clickCall = eventCalls.find((c) => {
        const body = JSON.parse(String((c[1] as RequestInit)?.body));
        return body.eventType === "click";
      });
      expect(clickCall).toBeTruthy();
      const body = JSON.parse(String((clickCall?.[1] as RequestInit)?.body));
      expect(body.diagnosis).toBeUndefined();
    });
  });
});
