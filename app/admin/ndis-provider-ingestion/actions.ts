"use server";

import { revalidatePath } from "next/cache";

import { runNdisProviderIngestion } from "@/lib/ingestion/ndisProviders";
import { requireAdmin } from "@/lib/auth/guards";

export async function triggerNdisProviderIngestion() {
  await requireAdmin();
  const result = await runNdisProviderIngestion({ dryRun: false });
  revalidatePath("/admin/ndis-provider-ingestion");
  return {
    ok: result.ok,
    providerCount: result.providerCount,
    runId: result.runId ?? null,
    durationMs: result.durationMs,
    error: result.error,
  };
}
