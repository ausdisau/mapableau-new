import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import {
  buildReleaseEvidencePack,
  detectCorridorWidthRegression,
  evaluateRedTeamCase,
  generateSyntheticBuilding,
  RED_TEAM_CORPUS,
  runRegressionAgainstBuilding,
  simulateAdapterContract,
} from "@/lib/access-intelligence/regression";
import { listAccessIntelligenceFlagStates } from "@/lib/access-intelligence/feature-flags";

export async function GET() {
  if (!accessIntelligenceFlags.regressionSimulator) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }
  return Response.json({
    enabled: true,
    redTeamCases: RED_TEAM_CORPUS.map((c) => ({
      code: c.code,
      category: c.category,
    })),
  });
}

export async function POST(request: Request) {
  if (!accessIntelligenceFlags.regressionSimulator) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "run_suite");

  if (action === "corridor_regression") {
    return Response.json({
      findings: detectCorridorWidthRegression({
        previousWidthMm: Number(body.previousWidthMm ?? 1000),
        nextWidthMm: Number(body.nextWidthMm ?? 700),
        minRequiredMm: Number(body.minRequiredMm ?? 850),
      }),
    });
  }

  if (action === "red_team") {
    return Response.json({
      result: evaluateRedTeamCase(String(body.code ?? "diagnosis_inference")),
    });
  }

  if (action === "adapter") {
    return Response.json({
      result: simulateAdapterContract({
        adapterKey: String(body.adapterKey ?? "bms"),
        mode: body.mode ?? "success",
      }),
    });
  }

  const building = generateSyntheticBuilding(
    (body.buildingType as "cafe") ?? "community_hall",
    String(body.seed ?? "api"),
  );
  const run = runRegressionAgainstBuilding(building);
  const pack = buildReleaseEvidencePack({
    versionLabel: String(body.versionLabel ?? "dev"),
    regressionFindings: run.findings.length,
    flagStates: listAccessIntelligenceFlagStates(),
  });

  return Response.json({
    ok: true,
    actorUserId: userId,
    building: { code: building.code, buildingType: building.buildingType },
    run,
    releaseEvidence: pack,
  });
}
