import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { parseAssuranceArgv } from "./argv";

async function main() {
  const args = parseAssuranceArgv();
  const pkg = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as {
    name: string;
    version: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const components = Object.entries({
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  }).map(([name, version]) => ({
    type: "library",
    name,
    version,
  }));

  const bom = {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      component: { type: "application", name: pkg.name, version: pkg.version },
      disclaimer: "Generated inventory stub for assurance — not a signed attestation.",
    },
    components,
  };

  if (args.dryRun) {
    console.log(JSON.stringify({ dryRun: true, componentCount: components.length }, null, 2));
    return;
  }

  const dir = path.join(process.cwd(), "artifacts", "assurance");
  await mkdir(dir, { recursive: true });
  const body = JSON.stringify(bom, null, 2);
  const file = path.join(dir, `sbom-${Date.now()}.json`);
  await writeFile(file, body, "utf8");
  const checksum = createHash("sha256").update(body).digest("hex");
  console.log(JSON.stringify({ file, checksum, componentCount: components.length }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
