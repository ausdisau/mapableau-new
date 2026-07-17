import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";
import { isHighRiskMethod } from "@/lib/wallet/recovery";

/**
 * federation:test-wallet-recovery
 *
 * Non-DB smoke test. Confirms the wallet recovery policy classifies
 * operator-assisted / guardian-shard / offline-paper-kit as high-risk and
 * therefore requires a human reviewer.
 */
async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));

  const highRisk = ["operator_assisted", "guardian_shard", "offline_paper_kit"] as const;
  const lowRisk = ["passkey_backup", "device_re_enrolment"] as const;

  const results: Array<{ name: string; ok: boolean }> = [];
  for (const m of highRisk) {
    results.push({ name: `high_risk:${m}`, ok: isHighRiskMethod(m) });
  }
  for (const m of lowRisk) {
    results.push({ name: `low_risk:${m}`, ok: !isHighRiskMethod(m as never) });
  }

  const passed = results.every((r) => r.ok);
  const report = dryRun
    ? {
        ...dryRunStubReport({
          name: "federation:test-wallet-recovery",
          summary: "dry-run: wallet recovery method risk classification",
          extras: { results },
        }),
        passed,
      }
    : {
        generatedAt: new Date().toISOString(),
        dryRun: false,
        results,
        passed,
      };

  const file = writeArtifact(
    "federation",
    `test-wallet-recovery-${ts()}.json`,
    report
  );
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
  if (!passed) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
