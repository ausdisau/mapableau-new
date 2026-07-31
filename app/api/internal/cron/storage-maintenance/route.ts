import { jsonError, jsonOk } from "@/lib/api/response";
import { runStorageMaintenance } from "@/lib/cron/storage-maintenance-service";

function isAuthorized(req: Request): boolean {
  const required = process.env.CRON_INTERNAL_TOKEN?.trim();
  if (!required) return false;
  const provided = req.headers.get("x-cron-token") ?? "";
  return provided === required;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return jsonError("Unauthorized", 401);
  }

  const url = new URL(req.url);
  const retentionHoursRaw = url.searchParams.get("retentionHours");
  const dryRun = url.searchParams.get("dryRun") === "true";
  const retentionHours = retentionHoursRaw ? Number(retentionHoursRaw) : undefined;

  const result = await runStorageMaintenance({
    retentionHours: Number.isFinite(retentionHours) ? retentionHours : undefined,
    dryRun,
    actorUserId: "system-cron",
  });

  return jsonOk({ ok: true, result });
}
