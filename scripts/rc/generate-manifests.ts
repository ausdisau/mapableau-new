import { execSync } from "node:child_process";

import {
  RC1_MANIFEST_DOCS_DIR,
  getMigrationNames,
  isMainModule,
  parseEnvExampleKeys,
  readJsonFile,
  repoPath,
  writeJson,
} from "./_shared";

type DependencyScope = "dependencies" | "devDependencies";

interface DependencyEntry {
  name: string;
  version: string;
  scope: DependencyScope;
}

function gitSha(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function packageDependencies(): DependencyEntry[] {
  const pkg = readJsonFile(repoPath("package.json"));
  return (["dependencies", "devDependencies"] as const).flatMap((scope) => {
    const dependencies = pkg[scope];
    if (
      !dependencies ||
      typeof dependencies !== "object" ||
      Array.isArray(dependencies)
    ) {
      return [];
    }
    return Object.entries(dependencies)
      .filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      )
      .map(([name, version]) => ({ name, version, scope }));
  });
}

export function generateManifests() {
  const generatedAt = new Date().toISOString();
  const dependencies = packageDependencies().sort(
    (a, b) => a.scope.localeCompare(b.scope) || a.name.localeCompare(b.name),
  );
  const featureFlags = parseEnvExampleKeys().filter((key) =>
    /^(ACCESSOPS_|WAVE|PILOT|PARTICIPATION)/.test(key),
  );
  const migrationNames = getMigrationNames();

  const manifests = {
    "build-manifest": {
      generatedAt,
      commitSha: gitSha(),
      branch: process.env.GITHUB_REF_NAME ?? "release/release-candidate-1",
    },
    "migration-manifest": {
      generatedAt,
      migrationCount: migrationNames.length,
      migrationNames,
      status:
        migrationNames.length === 0 ? "manual-review-required" : "inventoried",
    },
    "dependency-manifest": {
      generatedAt,
      dependencies,
    },
    "feature-flag-inventory": {
      generatedAt,
      flagCount: featureFlags.length,
      flags: featureFlags,
    },
    "public-capability-manifest": {
      generatedAt,
      capabilities: [
        { name: "tenant isolation", status: "implemented" },
        { name: "consent and delegation authority", status: "implemented" },
        { name: "AURA authority evaluation", status: "implemented" },
        { name: "participation life planner", status: "scaffolded" },
        { name: "NDIA live provider submission", status: "disabled" },
        { name: "AccessOps external feeds", status: "disabled" },
        { name: "AccessOps outdoor routing providers", status: "disabled" },
        { name: "Wave 20 constitutional invariants", status: "disabled" },
      ],
    },
    "sbom-lite": {
      generatedAt,
      components: dependencies.map((dependency) => ({
        name: dependency.name,
        version: dependency.version,
      })),
    },
  };

  for (const [name, payload] of Object.entries(manifests)) {
    writeJson(
      repoPath("docs", "releases", "rc1", "manifests", `${name}.json`),
      payload,
    );
  }

  return {
    generatedAt,
    outputDirectory: RC1_MANIFEST_DOCS_DIR,
    manifestCount: Object.keys(manifests).length,
  };
}

if (isMainModule(import.meta.url)) {
  console.log(JSON.stringify(generateManifests(), null, 2));
}
