import { prisma } from "@/lib/prisma";
import { evaluateContinuousAssurance } from "@/lib/continuous-assurance/evaluator";
import { decideGa } from "@/lib/production-readiness/ga-assessment";

import { parseArgs, writeArtifact, ts } from "../tenancy/_shared";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const file = writeArtifact(
      "platform",
      `assess-ga-${ts()}.json`,
      {
        generatedAt: new Date().toISOString(),
        dryRun: true,
        would: ["evaluate_without_db_writes"],
        note: "Dry-run only — no database connection required.",
      }
    );
    console.log(JSON.stringify({ dryRun: true, report: file }, null, 2));
    return;
  }
  const orgs = await prisma.organisation.findMany({
    select: { id: true, name: true, tenantStatus: true },
    take: 500,
  });
  const results = [] as Array<Record<string, unknown>>;
  for (const o of orgs) {
    const snapshot = await evaluateContinuousAssurance(o.id);
    const scorecard = {
      assurance: {
        ready: snapshot.failingControls === 0 && snapshot.outstandingExceptions === 0,
        score: Math.round(
          (snapshot.passingControls / Math.max(snapshot.totalControls, 1)) * 100
        ),
        blockers: [] as string[],
      },
      operationalHealth: { availability: null, errorBudgetBurn: null },
      entitlementsConfigured:
        (await prisma.tenantFeatureEntitlement.count({
          where: { organisationId: o.id, status: "active" },
        })) > 0,
      policiesConfigured:
        (await prisma.tenantPolicyProfile.count({
          where: { organisationId: o.id, status: "active" },
        })) > 0,
      incidentsOpen: 0,
      outstandingSecurityFindings: 0,
      outstandingComplaints: 0,
    };
    const decision = decideGa(scorecard);
    results.push({
      organisationId: o.id,
      name: o.name,
      tenantStatus: o.tenantStatus,
      recommendation: decision,
      note: "Recommendation only. AI cannot approve GA. A named executive must decide.",
    });
  }
  const file = writeArtifact("platform", `assess-ga-${ts()}.json`, {
    generatedAt: new Date().toISOString(),
    dryRun,
    results,
  });
  console.log(`assessed: ${results.length}`);
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
