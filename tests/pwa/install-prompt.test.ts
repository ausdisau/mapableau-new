import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("install prompt hook", () => {
  it("prevents default on beforeinstallprompt in hook source", () => {
    const hookPath = path.resolve(
      __dirname,
      "../../hooks/useInstallPrompt.ts"
    );
    const source = fs.readFileSync(hookPath, "utf8");
    expect(source).toContain("preventDefault");
    expect(source).toContain("beforeinstallprompt");
  });

  it("does not request notification permission", () => {
    const pwaDir = path.resolve(__dirname, "../../components/pwa");
    const files = fs.readdirSync(pwaDir).filter((f) => f.endsWith(".tsx"));
    const combined = files
      .map((f) => fs.readFileSync(path.join(pwaDir, f), "utf8"))
      .join("\n");
    expect(combined).not.toContain("Notification.requestPermission");
  });

  it("registers service worker only in client component", () => {
    const swReg = fs.readFileSync(
      path.resolve(__dirname, "../../components/pwa/ServiceWorkerRegister.tsx"),
      "utf8"
    );
    expect(swReg).toContain('"use client"');
    expect(swReg).toContain("navigator.serviceWorker.register");
    expect(swReg).toMatch(/development|NODE_ENV|NEXT_PUBLIC_PWA_SW_ENABLED/);
  });
});
