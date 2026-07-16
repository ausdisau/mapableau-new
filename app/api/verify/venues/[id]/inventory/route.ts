import { resolveAccessIntelligenceUser } from "@/lib/access-intelligence/api-auth";
import { requireVenueOperateAccess } from "@/lib/access-intelligence/auth/venue-access";
import { checkEntitlementForUser } from "@/lib/access-intelligence/entitlements-billing";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { getVerifyInventory } from "@/lib/access-intelligence/verify/inventory";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const user = await resolveAccessIntelligenceUser();
  if (user instanceof Response) return user;
  const { id: placeId } = await ctx.params;

  const entitlement = await checkEntitlementForUser({
    userId: user.id,
    roles: user.roles,
    feature: "verify_inventory",
  });
  if (!entitlement.allowed) {
    return Response.json(
      {
        error: entitlement.reason,
        code: "ENTITLEMENT_REQUIRED",
        source: entitlement.source,
      },
      { status: 403 },
    );
  }

  try {
    await requireVenueOperateAccess({
      user,
      placeId,
      roleHeader: request.headers.get("x-access-role"),
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 403 });
    }
    throw error;
  }

  const inventory = getVerifyInventory(placeId);
  if (!inventory) {
    return Response.json({ error: "Venue not found", code: "PLACE_NOT_FOUND" }, { status: 404 });
  }
  return Response.json({ ...inventory, entitlementSource: entitlement.source });
}
