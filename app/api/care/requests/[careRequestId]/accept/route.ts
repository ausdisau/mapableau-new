import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { providerAcceptCareRequest } from "@/lib/care/care-request-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ careRequestId: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const { careRequestId } = await params;
  const request = await providerAcceptCareRequest(careRequestId, user.id);
  return jsonOk({ request });
}
