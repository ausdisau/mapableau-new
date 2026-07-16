import { resolveAccessIntelligenceUser } from "@/lib/access-intelligence/api-auth";
import { checkEntitlement } from "@/lib/access-intelligence/entitlements";
import { exportPilotDataset, getPilot, listPilots } from "@/lib/access-intelligence/pilots/demo-pilot";

export async function GET(request: Request) {
  const user = await resolveAccessIntelligenceUser();
  if (user instanceof Response) return user;

  const entitlement = checkEntitlement({
    userId: user.id,
    roles: user.roles,
    feature: "pilot_console",
  });
  // Demo/evaluator: allow mapable_admin or enterprise; also allow demo verify_ops users to read list with label
  if (!entitlement.allowed && !user.roles.includes("mapable_admin")) {
    // Soft-open for demo: learners can view fictional pilot summary with community+ if env set
    const fromEnv = process.env.ACCESS_INTELLIGENCE_ALLOW_PILOT_DEMO === "true";
    if (!fromEnv && process.env.ACCESS_INTELLIGENCE_DEMO_MODE === "false") {
      return Response.json(
        { error: entitlement.reason, code: "ENTITLEMENT_REQUIRED" },
        { status: 403 },
      );
    }
  }

  const url = new URL(request.url);
  const exportId = url.searchParams.get("export");
  if (exportId) {
    const exportGate = checkEntitlement({
      userId: user.id,
      roles: user.roles,
      feature: "pilot_export",
    });
    if (
      !exportGate.allowed &&
      !user.roles.includes("mapable_admin") &&
      process.env.ACCESS_INTELLIGENCE_DEMO_MODE === "false"
    ) {
      return Response.json(
        { error: exportGate.reason, code: "ENTITLEMENT_REQUIRED" },
        { status: 403 },
      );
    }
    const data = exportPilotDataset(exportId);
    if (!data) {
      return Response.json({ error: "Pilot not found" }, { status: 404 });
    }
    return Response.json(data);
  }

  const id = url.searchParams.get("id");
  if (id) {
    const pilot = getPilot(id);
    if (!pilot) return Response.json({ error: "Pilot not found" }, { status: 404 });
    return Response.json(pilot);
  }

  return Response.json({
    pilots: listPilots().map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      fictionalWarning: p.fictionalWarning,
    })),
  });
}
