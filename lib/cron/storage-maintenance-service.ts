import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { getLocalStorageRoot, getPlatformStorageBackend } from "@/lib/storage/platform-object-storage";

export type StorageMaintenanceResult = {
  backend: string;
  scanned: number;
  deleted: number;
  skipped: number;
  cutoffIso: string;
};

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

export async function runStorageMaintenance(options?: {
  retentionHours?: number;
  dryRun?: boolean;
  actorUserId?: string;
}): Promise<StorageMaintenanceResult> {
  const backend = getPlatformStorageBackend();
  const retentionHours = Math.max(options?.retentionHours ?? 24 * 14, 1);
  const cutoff = new Date(Date.now() - retentionHours * 60 * 60 * 1000);

  if (backend !== "local") {
    return {
      backend,
      scanned: 0,
      deleted: 0,
      skipped: 0,
      cutoffIso: cutoff.toISOString(),
    };
  }

  const root = getLocalStorageRoot();
  const files = await collectFiles(root);
  let deleted = 0;
  let skipped = 0;

  for (const file of files) {
    const fileStat = await stat(file).catch(() => null);
    if (!fileStat) {
      skipped += 1;
      continue;
    }

    if (fileStat.mtime > cutoff) {
      skipped += 1;
      continue;
    }

    if (!options?.dryRun) {
      await rm(file, { force: true }).catch(() => undefined);
    }
    deleted += 1;
  }

  await createAuditEvent({
    actorUserId: options?.actorUserId ?? null,
    action: "storage.maintenance.run",
    entityType: "StorageMaintenance",
    entityId: "platform-storage",
    metadata: {
      backend,
      scanned: files.length,
      deleted,
      skipped,
      retentionHours,
      dryRun: Boolean(options?.dryRun),
    },
  });

  return {
    backend,
    scanned: files.length,
    deleted,
    skipped,
    cutoffIso: cutoff.toISOString(),
  };
}
