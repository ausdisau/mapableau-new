import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getTripForViewer } from "@/lib/transport-mvp/access-control";
import { getInvoicePlaceholder } from "@/lib/transport-mvp/invoice-placeholder-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;

  try {
    await getTripForViewer(id, user);
    const placeholder = await getInvoicePlaceholder(id);
    return jsonOk({ placeholder });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError("Not found", 404);
  }
}
