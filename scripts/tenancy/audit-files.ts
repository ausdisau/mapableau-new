/**
 * File audit — placeholder. In Wave 8, files are managed by external storage.
 * We don't have a local files table to audit; we surface the object-path
 * policy so that CI can regression-check it.
 */
import {
  assertSafeTenantKey,
  tenantObjectPath,
} from "@/lib/tenancy/storage/object-path";

import { parseArgs, writeArtifact, ts } from "./_shared";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  const sampleTenant = "tenant_example_key_1";
  try {
    assertSafeTenantKey(sampleTenant);
  } catch (e) {
    console.error(e);
  }
  const samplePath = tenantObjectPath(sampleTenant, "private", "docs", "abc.pdf");
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    samplePath,
    policy: "Every private object path must start with tenants/{tenantKey}/…",
  };
  const file = writeArtifact("tenancy", `audit-files-${ts()}.json`, report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
