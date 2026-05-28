import { requireApiPermission } from "@/lib/api/auth-handler";
import { createCareBookingCheckout } from "@/lib/billing-core/module-checkout-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:read:self");
  if (user instanceof Response) return user;
  const { id } = await params;

  const result = await createCareBookingCheckout(user.id, id);
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
