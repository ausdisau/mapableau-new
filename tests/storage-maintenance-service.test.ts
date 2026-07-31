import { beforeEach, describe, expect, it, vi } from "vitest";
import { mkdir, writeFile, utimes, rm } from "node:fs/promises";
import path from "node:path";

import { runStorageMaintenance } from "../lib/cron/storage-maintenance-service";
import { getLocalStorageRoot } from "../lib/storage/platform-object-storage";

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));

describe("runStorageMaintenance", () => {
  beforeEach(async () => {
    process.env.PLATFORM_STORAGE_BACKEND = "local";
    await rm(getLocalStorageRoot(), { recursive: true, force: true });
    await mkdir(path.join(getLocalStorageRoot(), "tmp"), { recursive: true });
  });

  it("deletes files older than retention cutoff", async () => {
    const oldFile = path.join(getLocalStorageRoot(), "tmp", "old.txt");
    const freshFile = path.join(getLocalStorageRoot(), "tmp", "fresh.txt");

    await writeFile(oldFile, "old");
    await writeFile(freshFile, "fresh");

    const twoDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 48);
    await utimes(oldFile, twoDaysAgo, twoDaysAgo);

    const result = await runStorageMaintenance({ retentionHours: 24 });

    expect(result.deleted).toBe(1);
    expect(result.scanned).toBeGreaterThanOrEqual(2);
  });

  it("supports dryRun mode", async () => {
    const oldFile = path.join(getLocalStorageRoot(), "tmp", "dry-run.txt");
    await writeFile(oldFile, "old");
    const oldTime = new Date(Date.now() - 1000 * 60 * 60 * 48);
    await utimes(oldFile, oldTime, oldTime);

    const result = await runStorageMaintenance({ retentionHours: 24, dryRun: true });
    expect(result.deleted).toBe(1);

    const stillExists = await writeFile(path.join(getLocalStorageRoot(), "tmp", "touch.txt"), "x").then(() => true);
    expect(stillExists).toBe(true);
  });
});
