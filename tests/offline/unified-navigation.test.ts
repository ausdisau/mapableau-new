import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

import { describe, expect, it, vi } from "vitest";

const source = readFileSync("public/sw.js", "utf8");
const site = "https://mapable.example";

type WorkerEvent = {
  request?: { method: string; mode: string; url: string };
  respondWith?: (response: Promise<Response>) => void;
  waitUntil?: (work: Promise<unknown>) => void;
};

function serviceWorker() {
  const listeners = new Map<string, (event: WorkerEvent) => void>();
  const fetch = vi.fn();
  const cache = {
    match: vi.fn().mockResolvedValue(new Response("Offline")),
    put: vi.fn(),
    add: vi.fn(),
  };
  const caches = {
    open: vi.fn().mockResolvedValue(cache),
    keys: vi
      .fn()
      .mockResolvedValue([
        "mapable-offline-v1-shell",
        "mapable-offline-v1-tiles",
      ]),
    delete: vi.fn(),
  };
  const self = {
    location: new URL(site),
    clients: { claim: vi.fn() },
    addEventListener: (event: string, handler: (event: WorkerEvent) => void) =>
      listeners.set(event, handler),
  };
  runInNewContext(source, { self, caches, fetch, URL, Response });
  function navigate(path: string) {
    const request = {
      method: "GET",
      mode: "navigate",
      url: new URL(path, site).href,
    };
    return new Promise<Response>((resolve) =>
      listeners.get("fetch")!({ request, respondWith: resolve }),
    );
  }
  return { fetch, cache, caches, listeners, navigate };
}

describe("offline navigation for Unified and signed-in trips", () => {
  it.each(["/dashboard/transport", "/unified?open=1"])(
    "fetches %s online and serves only the public fallback offline",
    async (path) => {
      const worker = serviceWorker();
      worker.fetch
        .mockResolvedValueOnce(new Response("Online"))
        .mockRejectedValueOnce(new TypeError("offline"));
      expect(await (await worker.navigate(path)).text()).toBe("Online");
      expect(worker.cache.put).not.toHaveBeenCalled();
      expect(await (await worker.navigate(path)).text()).toBe("Offline");
      expect(worker.cache.match.mock.calls).toEqual([["/offline"]]);
    },
  );

  it("removes the former document cache without removing cached map tiles", async () => {
    const worker = serviceWorker();
    await new Promise((resolve) =>
      worker.listeners.get("activate")!({ waitUntil: resolve }),
    );
    expect(worker.caches.delete.mock.calls).toEqual([
      ["mapable-offline-v1-shell"],
    ]);
  });
});
