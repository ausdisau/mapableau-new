import { webcrypto } from "node:crypto";

import { afterAll, beforeAll, vi } from "vitest";

// JSDOM lacks IndexedDB. Use a real, non-extractable Web Crypto key for the
// storage tests. The browser check exercises the IndexedDB key round trip.
vi.mock("@/lib/transport/passenger-local-key", async () => {
  const { webcrypto: crypto } = await import("node:crypto");
  const key = crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  return { passengerLocalKey: () => key };
});
beforeAll(() => {
  vi.stubGlobal("crypto", webcrypto);
});
afterAll(() => {
  vi.unstubAllGlobals();
});
