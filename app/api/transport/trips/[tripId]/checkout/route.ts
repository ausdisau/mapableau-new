import { requireApiPermission } from "@/lib/api/auth-handler";
import { createTransportTripCheckout } from "@/lib/billing-core/module-checkout-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiPermission("transport:manage:self");
  if (user instanceof Response) return user;
  const { tripId } = await params;

  const result = await createTransportTripCheckout(user.id, tripId);
  if (!result.ok) {
    const status = "decision" in result && result.decision ? 200 : 400;
    return Response.json(
      {
        error: result.error,
        checkout: "decision" in result ? result.decision : undefined,
      },
      { status }
    );
  }

  return Response.json({
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId,
  });
}
