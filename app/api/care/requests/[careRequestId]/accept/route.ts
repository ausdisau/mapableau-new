import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { acceptCareRequestWithSync } from "@/lib/modules/care-facade";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ careRequestId: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const { careRequestId } = await params;
  const request = await acceptCareRequestWithSync(careRequestId, user.id);
  return jsonOk({ request });
}
