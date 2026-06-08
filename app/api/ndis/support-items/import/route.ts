import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { phase4Config } from "@/lib/config/phase4";
import { importSupportItemsFromRows } from "@/lib/ndis/ndis-suggestion-service";

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  if (!phase4Config.ndisSupportItemImportEnabled) {
    return jsonError("Support item import disabled", 403);
  }

  const body = await req.json();
  if (!Array.isArray(body.rows)) {
    return jsonError("rows array required", 400);
  }

  const items = await importSupportItemsFromRows(body.rows);
  return jsonOk({ imported: items.length, items }, 201);
}
