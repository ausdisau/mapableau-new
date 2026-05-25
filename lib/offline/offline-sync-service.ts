import { discardDraft, listDrafts, type QueuedDraft } from "@/lib/offline/offline-queue-service";

export type SyncResult = {
  synced: string[];
  failed: { id: string; reason: string }[];
  skipped: string[];
};

/**
 * Sync queued drafts when online. Caller must verify auth + permissions first.
 */
export async function syncOfflineDrafts(options: {
  online: boolean;
  authenticated: boolean;
  canSyncType: (type: QueuedDraft["type"]) => boolean;
  submitDraft: (draft: QueuedDraft) => Promise<void>;
}): Promise<SyncResult> {
  const result: SyncResult = { synced: [], failed: [], skipped: [] };

  if (!options.online || !options.authenticated) {
    return result;
  }

  const drafts = await listDrafts();

  for (const draft of drafts) {
    if (!options.canSyncType(draft.type)) {
      result.skipped.push(draft.id);
      continue;
    }
    try {
      await options.submitDraft(draft);
      await discardDraft(draft.id);
      result.synced.push(draft.id);
    } catch (err) {
      result.failed.push({
        id: draft.id,
        reason: err instanceof Error ? err.message : "Sync failed",
      });
    }
  }

  return result;
}
