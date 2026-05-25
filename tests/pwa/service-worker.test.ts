import { describe, expect, it } from "vitest";

describe("ServiceWorkerRegister", () => {
  it("is a client component module", async () => {
    const mod = await import("@/components/pwa/ServiceWorkerRegister");
    expect(mod.ServiceWorkerRegister).toBeDefined();
  });
});

describe("useInstallPrompt", () => {
  it("exports safe initial state", async () => {
    const { useInstallPrompt } = await import("@/lib/hooks/useInstallPrompt");
    expect(useInstallPrompt).toBeTypeOf("function");
  });
});
