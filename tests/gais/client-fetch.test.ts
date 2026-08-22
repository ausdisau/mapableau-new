import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchGaisFeaturesInBounds } from "@/lib/gais/client/fetch-features";

describe("GAIS client fetch", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          type: "FeatureCollection",
          features: [],
          meta: {
            claimState: "in_development",
            evidenceScope: "test",
            generatedAt: new Date().toISOString(),
            liveNationalRouting: false,
            featureCount: 0,
          },
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests features with bounds params", async () => {
    const controller = new AbortController();
    await fetchGaisFeaturesInBounds(
      { minLat: -34, minLng: 150, maxLat: -33.9, maxLng: 150.2 },
      controller.signal,
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("minLat=-34"),
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("propagates aborted fetch via AbortSignal", async () => {
    const controller = new AbortController();
    controller.abort();
    vi.mocked(fetch).mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));
    await expect(
      fetchGaisFeaturesInBounds(
        { minLat: -34, minLng: 150, maxLat: -33.9, maxLng: 150.2 },
        controller.signal,
      ),
    ).rejects.toThrow();
  });
});
