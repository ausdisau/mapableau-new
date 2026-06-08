import { createCampaignCheckout } from "@/lib/ads/billing-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  const result = await createCampaignCheckout(user, id);
  if (!result.ok) return jsonError(result.error ?? "Checkout failed", 400);

  return jsonOk({
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId,
  });
}
