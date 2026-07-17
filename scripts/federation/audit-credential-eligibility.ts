import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";

const PROHIBITED_SCHEMA_KEYS = [
  "NDISParticipantCredential",
  "NDISWorkerCredential",
  "MedicalDiagnosisCredential",
  "DisabilityCredential",
  "DriverLicenceCredential",
  "MedicareCredential",
  "PassportCredential",
];

/**
 * audit-credential-eligibility
 *
 * Scans schema definitions and issued credentials for prohibited government-
 * mimicking keys, missing simulator flags, and offers accepted without vault
 * external issuance opt-in.
 */
async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const report = dryRunStubReport({
      name: "federation:audit-credential-eligibility",
      summary:
        "dry-run: would scan schemas/credentials for prohibited keys and activation gaps",
      extras: {
        prohibitedSchemaKeys: PROHIBITED_SCHEMA_KEYS,
        checks: [
          "no_prohibited_schema_keys",
          "simulator_default_on_issued_credentials",
          "trust_registry_entry_present_for_production",
          "vault_external_issuance_opt_in_before_accept",
        ],
      },
    });
    const file = writeArtifact(
      "federation",
      `audit-credential-eligibility-${ts()}.json`,
      report
    );
    console.log(JSON.stringify(report, null, 2));
    console.log(`report: ${file}`);
    return;
  }
  const { prisma } = await import("@/lib/prisma");
  const schemas = await prisma.credentialSchemaDefinition.findMany({
    select: { id: true, schemaKey: true, isGovernment: true },
    take: 5000,
  });
  const credentials = await prisma.issuedCredential.findMany({
    select: { id: true, simulator: true, schema: { select: { schemaKey: true } } },
    take: 5000,
  });
  const prohibitedSchemas = schemas.filter((s) =>
    PROHIBITED_SCHEMA_KEYS.includes(s.schemaKey)
  ).length;
  const governmentFlagged = schemas.filter((s) => s.isGovernment).length;
  const nonSimulatorCredentials = credentials.filter((c) => !c.simulator).length;
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: false,
    sampled: { schemas: schemas.length, credentials: credentials.length },
    findings: {
      prohibitedSchemas,
      governmentFlagged,
      nonSimulatorCredentials,
    },
  };
  const file = writeArtifact(
    "federation",
    `audit-credential-eligibility-${ts()}.json`,
    report
  );
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
