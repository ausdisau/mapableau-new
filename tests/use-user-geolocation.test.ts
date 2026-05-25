/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUserGeolocation } from "@/hooks/useUserGeolocation";

describe("useUserGeolocation", () => {
  const getCurrentPosition = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("navigator", {
      geolocation: { getCurrentPosition },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns unavailable when geolocation is not supported", () => {
    vi.stubGlobal("navigator", {});
    const { result } = renderHook(() => useUserGeolocation());
    expect(result.current.isSupported).toBe(false);
    expect(result.current.status).toBe("unavailable");
  });

  it("stores location on success", async () => {
    getCurrentPosition.mockImplementation((success: PositionCallback) => {
      success({
        coords: {
          latitude: -33.87,
          longitude: 151.21,
          accuracy: 50,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    });

    const { result } = renderHook(() => useUserGeolocation());
    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.status).toBe("granted");
    expect(result.current.location?.latitude).toBeCloseTo(-33.87, 2);
    expect(result.current.location?.source).toBe("browser_geolocation");
  });

  it("returns denied status on permission error", async () => {
    getCurrentPosition.mockImplementation(
      (_s: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 1, message: "denied" } as GeolocationPositionError);
      },
    );

    const { result } = renderHook(() => useUserGeolocation());
    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.status).toBe("denied");
    expect(result.current.errorMessage).toMatch(/could not access/i);
    expect(result.current.location).toBeNull();
  });

  it("returns timeout status on timeout error", async () => {
    getCurrentPosition.mockImplementation(
      (_s: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 3, message: "timeout" } as GeolocationPositionError);
      },
    );

    const { result } = renderHook(() => useUserGeolocation());
    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.status).toBe("timeout");
  });

  it("clearLocation resets state", async () => {
    getCurrentPosition.mockImplementation((success: PositionCallback) => {
      success({
        coords: {
          latitude: 1,
          longitude: 2,
          accuracy: 1,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    });

    const { result } = renderHook(() => useUserGeolocation());
    await act(async () => {
      result.current.requestLocation();
    });
    act(() => {
      result.current.clearLocation();
    });
    expect(result.current.location).toBeNull();
    expect(result.current.status).toBe("idle");
  });
});
