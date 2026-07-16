#!/usr/bin/env tsx
/**
 * MapAble Academy catalogue importer (development / admin).
 * Does not run in ordinary HTTP requests.
 *
 * Defaults to dry-run. Mutations require --apply.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { applyCatalogueImport } from "@/lib/academy/catalogue/import/apply";
import { parseCatalogueWorkbook } from "@/lib/academy/catalogue/import/parse-workbook";
import { validateParsedWorkbook } from "@/lib/academy/catalogue/import/validate";

function flag(name: string): boolean {
  return process.argv.includes(name);
}

function argValue(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return undefined;
}

async function main() {
  const file =
    argValue("--file") ?? "data/academy/catalogue-workbook.json";
  const filePath = resolve(process.cwd(), file);
  const apply = flag("--apply");
  const validateOnly = flag("--validate-only");
  const dryRun = !apply;
  const school = argValue("--school");
  const waveArg = argValue("--wave");
  const outputJson = argValue("--output-json");

  const waveFilter =
    waveArg === "wave-1"
      ? "WAVE_1_LAUNCH"
      : waveArg === "wave-2"
        ? "WAVE_2_EXPANSION"
        : waveArg === "wave-3"
          ? "WAVE_3_SPECIALIST"
          : undefined;

  console.log(`Parsing ${filePath} ...`);
  const parsed = await parseCatalogueWorkbook(filePath);
  console.log(
    `Checksum ${parsed.checksum.slice(0, 12)}… · ${parsed.schools.length} schools · ${parsed.courses.length} courses`,
  );

  const validation = validateParsedWorkbook(parsed);
  for (const issue of validation.issues) {
    console.log(
      `[${issue.severity}] ${issue.courseCode ?? ""} ${issue.field ?? ""} ${issue.message}`,
    );
  }

  if (!validation.ok && apply) {
    console.error("Validation failed — refusing --apply (no partial writes).");
    process.exit(1);
  }

  const result = await applyCatalogueImport(parsed, validation, {
    dryRun,
    validateOnly,
    schoolFilter: school,
    waveFilter,
    initiatedBy: process.env.ACADEMY_IMPORT_ACTOR ?? "cli",
  });

  console.log(
    JSON.stringify(
      {
        dryRun: result.dryRun,
        createdCount: result.createdCount,
        updatedCount: result.updatedCount,
        unchangedCount: result.unchangedCount,
        rejectedCount: result.rejectedCount,
        importRunId: result.importRunId,
        validationOk: validation.ok,
      },
      null,
      2,
    ),
  );

  if (outputJson) {
    writeFileSync(
      resolve(process.cwd(), outputJson),
      JSON.stringify({ parsed, validation, result }, null, 2),
    );
    console.log(`Wrote ${outputJson}`);
  }

  if (!validation.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
