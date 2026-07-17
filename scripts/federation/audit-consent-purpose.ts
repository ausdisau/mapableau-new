import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";

/**
 * audit-consent-purpose
 *
 * Confirms every ConsentDirective and legacy ConsentRecord carries a
 * meaningful purpose string. Fails ambiguity: "yes / OK / I agree" and empty
 * strings must be treated as insufficient.
 */
const AMBIGUOUS = new Set(["", "yes", "ok", "sure", "agree", "consent"]);

function isAmbiguous(purpose: string | null | undefined): boolean {
  if (!purpose) return true;
  return AMBIGUOUS.has(purpose.trim().toLowerCase());
}

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const report = dryRunStubReport({
      name: "federation:audit-consent-purpose",
      summary: "dry-run: would flag ambiguous purpose strings across directives + legacy records",
      extras: {
        ambiguousExamples: Array.from(AMBIGUOUS),
      },
    });
    const file = writeArtifact(
      "federation",
      `audit-consent-purpose-${ts()}.json`,
      report
    );
    console.log(JSON.stringify(report, null, 2));
    console.log(`report: ${file}`);
    return;
  }
  const { prisma } = await import("@/lib/prisma");
  const directives = await prisma.consentDirective.findMany({
    select: { id: true, purposeDetail: true },
    take: 5000,
  });
  const records = await prisma.consentRecord.findMany({
    select: { id: true, purpose: true },
    take: 5000,
  });
  const findings = {
    directiveAmbiguous: directives.filter((d) => isAmbiguous(d.purposeDetail)).length,
    recordAmbiguous: records.filter((r) => isAmbiguous(r.purpose)).length,
  };
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: false,
    sampled: { directives: directives.length, records: records.length },
    findings,
  };
  const file = writeArtifact(
    "federation",
    `audit-consent-purpose-${ts()}.json`,
    report
  );
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
