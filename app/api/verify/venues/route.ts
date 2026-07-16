import { resolveAccessIntelligenceUser } from "@/lib/access-intelligence/api-auth";
import {
  checkEntitlement,
  resolveAccessIntelligencePlan,
  ACCESS_INTELLIGENCE_PLAN_LABELS,
} from "@/lib/access-intelligence/entitlements";
import { listVerifyVenues } from "@/lib/access-intelligence/verify/inventory";

export async function GET(request: Request) {
  const user = await resolveAccessIntelligenceUser();
  if (user instanceof Response) return user;

  const url = new URL(request.url);
  const portfolio = url.searchParams.get("portfolio") === "1";

  const entitlement = checkEntitlement({
    userId: user.id,
    roles: user.roles,
    feature: portfolio ? "verify_portfolio" : "verify_inventory",
  });
  if (!entitlement.allowed) {
    return Response.json(
      {
        error: entitlement.reason,
        code: "ENTITLEMENT_REQUIRED",
        plan: entitlement.plan,
        planLabel: ACCESS_INTELLIGENCE_PLAN_LABELS[entitlement.plan],
        portfolioDenied: portfolio,
        recoveryHint: portfolio
          ? "Upgrade to Verify Portfolio or Enterprise for cross-site analytics."
          : "Upgrade to Verify Starter or enable demo plan.",
      },
      { status: 403 },
    );
  }

  const plan = resolveAccessIntelligencePlan({
    userId: user.id,
    roles: user.roles,
  });

  return Response.json({
    plan,
    planLabel: ACCESS_INTELLIGENCE_PLAN_LABELS[plan],
    venues: listVerifyVenues(),
    portfolio: portfolio || undefined,
    note: "All listed venues are fictional demonstration places unless separately linked to MapAble places.",
  });
}
