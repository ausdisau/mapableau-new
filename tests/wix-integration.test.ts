import { describe, expect, it } from "vitest";

import {
  getMapableAppUrl,
  getWixApiAllowedOrigins,
  getWixEmbedProviderFinderUrl,
  MAPABLE_WIX_SITE_URL,
} from "@/lib/integrations/wix/config";
import {
  isAllowedWixOrigin,
  isWixCorsApiPath,
  wixCorsHeaders,
} from "@/lib/integrations/wix/cors";

describe("Wix integration config", () => {
  it("includes mapabl.au marketing origins", () => {
    const origins = getWixApiAllowedOrigins();
    expect(origins).toContain("https://www.mapabl.au");
    expect(origins).toContain("https://mapabl.au");
  });

  it("builds embed URL from app base", () => {
    expect(getWixEmbedProviderFinderUrl()).toMatch(/\/embed\/provider-finder$/);
    expect(getMapableAppUrl()).not.toMatch(/\/$/);
  });

  it("exposes primary Wix site constant", () => {
    expect(MAPABLE_WIX_SITE_URL).toBe("https://www.mapabl.au");
  });
});

describe("Wix CORS helpers", () => {
  it("recognises autocomplete API path", () => {
    expect(isWixCorsApiPath("/api/search/autocomplete")).toBe(true);
    expect(isWixCorsApiPath("/api/me")).toBe(false);
  });

  it("allows mapabl.au origin", () => {
    expect(isAllowedWixOrigin("https://www.mapabl.au")).toBe(true);
    expect(isAllowedWixOrigin("https://evil.example")).toBe(false);
    expect(isAllowedWixOrigin(null)).toBe(false);
  });

  it("returns ACAO header for allowed origin", () => {
    const headers = wixCorsHeaders("https://www.mapabl.au");
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://www.mapabl.au");
    expect(headers.Vary).toBe("Origin");
  });
});
