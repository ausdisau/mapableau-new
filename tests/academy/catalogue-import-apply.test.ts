import { beforeAll, describe, expect, it } from "vitest";

import { applyCatalogueImport } from "@/lib/academy/catalogue/import/apply";
import { parseCatalogueWorkbook } from "@/lib/academy/catalogue/import/parse-workbook";
import { validateParsedWorkbook } from "@/lib/academy/catalogue/import/validate";
import { prisma } from "@/lib/prisma";

const WORKBOOK = "data/academy/catalogue-workbook.json";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.runIf(hasDb)("catalogue import apply (integration)", () => {
  beforeAll(async () => {
    // Isolation: only safe on local/dev test DBs
  });

  it("dry-run performs zero writes to curriculum import runs", async () => {
    const beforeRuns = await prisma.curriculumImportRun.count();
    const beforeCourses = await prisma.course.count();
    const parsed = await parseCatalogueWorkbook(WORKBOOK);
    const validation = validateParsedWorkbook(parsed);
    expect(validation.ok).toBe(true);

    const result = await applyCatalogueImport(parsed, validation, {
      dryRun: true,
    });
    expect(result.dryRun).toBe(true);
    expect(result.createdCount + result.updatedCount + result.unchangedCount).toBeGreaterThan(
      0,
    );

    expect(await prisma.curriculumImportRun.count()).toBe(beforeRuns);
    expect(await prisma.course.count()).toBe(beforeCourses);
  });

  it("apply is idempotent on repeat", async () => {
    const parsed = await parseCatalogueWorkbook(WORKBOOK);
    const validation = validateParsedWorkbook(parsed);
    expect(validation.ok).toBe(true);

    await applyCatalogueImport(parsed, validation, {
      dryRun: false,
      initiatedBy: "cli",
    });

    const schoolCount = await prisma.academySchool.count();
    expect(schoolCount).toBe(14);
    const imported = await prisma.course.count({
      where: { schoolId: { not: null } },
    });
    expect(imported).toBe(142);

    const second = await applyCatalogueImport(parsed, validation, {
      dryRun: false,
      initiatedBy: "cli",
    });
    expect(second.createdCount).toBe(0);
    expect(second.updatedCount + second.unchangedCount).toBe(142);

    const afterImported = await prisma.course.count({
      where: { schoolId: { not: null } },
    });
    expect(afterImported).toBe(142);

    const runs = await prisma.curriculumImportRun.count({
      where: { result: "applied" },
    });
    expect(runs).toBeGreaterThanOrEqual(1);

    const mwf = await prisma.course.findUnique({ where: { code: "MWF-001" } });
    if (mwf) {
      expect(mwf.code).toBe("MWF-001");
    }
  }, 120_000);
});
