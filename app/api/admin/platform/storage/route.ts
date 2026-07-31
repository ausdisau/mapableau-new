import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { runStorageMaintenance } from "@/lib/cron/storage-maintenance-service";
import { listPrefix } from "@/lib/storage/platform-object-storage";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const prefix = url.searchParams.get("prefix")?.trim() || "";

  try {
    const objects = prefix ? await listPrefix(prefix) : [];
    return jsonOk({
      backend: process.env.PLATFORM_STORAGE_BACKEND ?? "local",
      prefix,
      objects,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to list storage objects",
      500,
    );
  }
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const body = (await req.json().catch(() => ({}))) as {
    retentionHours?: number;
    dryRun?: boolean;
  };

  const retentionHours =
    typeof body.retentionHours === "number" && Number.isFinite(body.retentionHours)
      ? body.retentionHours
      : undefined;
  const dryRun = body.dryRun === true;

  const result = await runStorageMaintenance({
    retentionHours,
    dryRun,
    actorUserId: user.id,
  });

  return jsonOk({ ok: true, result });
}
