import { jsonError, jsonOk } from "@/lib/api/response";
import { getProviderPublicDetail } from "@/lib/providers/provider-search-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const detail = await getProviderPublicDetail(id);
  if (!detail) return jsonError("Not found", 404);
  return jsonOk({ provider: detail });
}
