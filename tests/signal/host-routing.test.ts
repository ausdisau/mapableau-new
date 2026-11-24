import { describe, expect, it } from "vitest";

import {
  DEFAULT_SIGNAL_HOST,
  isSignalHost,
  signalRewritePath,
} from "@/lib/signal/host-routing";

describe("MapAble Signal host routing", () => {
  it("recognises the Signal subdomain from forwarded host", () => {
    expect(isSignalHost("signal.mapable.com.au", "mapable.com.au")).toBe(true);
  });

  it("recognises the Signal subdomain from host when forwarded host is absent", () => {
    expect(isSignalHost(null, `${DEFAULT_SIGNAL_HOST}:443`)).toBe(true);
  });

  it("does not route the main MapAble host into Signal", () => {
    expect(isSignalHost("mapable.com.au", "mapable.com.au")).toBe(false);
  });

  it("rewrites the Signal host root to /signal", () => {
    expect(signalRewritePath("/")).toBe("/signal");
  });

  it("rewrites clean Signal subdomain paths into the Signal route group", () => {
    expect(signalRewritePath("/challenges")).toBe("/signal/challenges");
  });

  it("does not double-prefix explicit Signal routes", () => {
    expect(signalRewritePath("/signal")).toBeNull();
    expect(signalRewritePath("/signal/manage")).toBeNull();
  });

  it("does not rewrite API requests or static files", () => {
    expect(signalRewritePath("/api/health")).toBeNull();
    expect(signalRewritePath("/images/mapable.svg")).toBeNull();
    expect(signalRewritePath("/robots.txt")).toBeNull();
  });
});
