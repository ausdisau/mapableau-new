import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";
import { checkStatusList } from "@/lib/federation-conformance/status-list";

/**
 * federation:test-status
 *
 * Non-DB smoke test that verifies the status list conformance policy
 * refuses under-sized lists and public exposure when the flag is off.
 */
async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));

  const cases = [
    {
      name: "min_size_enforced",
      list: {
        id: "sl-1",
        listKey: "test",
        size: 1024,
        encodedList: "",
        privateOnly: true,
        rotationIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      shouldFail: true,
    },
    {
      name: "private_only_default_ok",
      list: {
        id: "sl-2",
        listKey: "test",
        size: 131072,
        encodedList: "",
        privateOnly: true,
        rotationIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      shouldFail: false,
    },
    {
      name: "public_without_flag_refused",
      list: {
        id: "sl-3",
        listKey: "test",
        size: 131072,
        encodedList: "",
        privateOnly: false,
        rotationIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      shouldFail: process.env.FEDERATION_STATUS_LIST_PUBLIC !== "true",
    },
  ] as const;

  const results = cases.map((c) => {
    const findings = checkStatusList(c.list as never);
    const failed = findings.some((f) => !f.ok);
    return {
      name: c.name,
      ok: c.shouldFail ? failed : !failed,
      findings,
    };
  });

  const passed = results.every((r) => r.ok);
  const report = dryRun
    ? {
        ...dryRunStubReport({
          name: "federation:test-status",
          summary: "dry-run smoke test — status list conformance",
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

  const file = writeArtifact("federation", `test-status-${ts()}.json`, report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
  if (!passed) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
