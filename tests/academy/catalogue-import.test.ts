import { describe, expect, it } from "vitest";

import {
  EXPECTED_COURSE_COUNT,
  EXPECTED_SCHOOL_COUNT,
  EXPECTED_WAVE_COUNTS,
  credentialImpliesAqf,
  STANDARD_CREDENTIAL_TYPE,
} from "@/lib/academy/catalogue/import/constants";
import { parseCatalogueWorkbook } from "@/lib/academy/catalogue/import/parse-workbook";
import {
  forcePlannedForImport,
  validateParsedWorkbook,
} from "@/lib/academy/catalogue/import/validate";

const WORKBOOK = "data/academy/catalogue-workbook.json";

describe("catalogue workbook parse + validate", () => {
  it("parses 142 courses and 14 schools with correct wave totals", async () => {
    const parsed = await parseCatalogueWorkbook(WORKBOOK);
    expect(parsed.courses).toHaveLength(EXPECTED_COURSE_COUNT);
    expect(parsed.schools).toHaveLength(EXPECTED_SCHOOL_COUNT);

    const waves = {
      WAVE_1_LAUNCH: 0,
      WAVE_2_EXPANSION: 0,
      WAVE_3_SPECIALIST: 0,
    };
    for (const c of parsed.courses) {
      waves[c.releaseWave] += 1;
    }
    expect(waves).toEqual({ ...EXPECTED_WAVE_COUNTS });

    const validation = validateParsedWorkbook(parsed);
    const errors = validation.issues.filter((i) => i.severity === "error");
    expect(errors).toEqual([]);
    expect(validation.ok).toBe(true);
  });

  it("rejects duplicate course codes", async () => {
    const parsed = await parseCatalogueWorkbook(WORKBOOK);
    parsed.courses.push({ ...parsed.courses[0]!, rowNumber: 999 });
    const validation = validateParsedWorkbook(parsed);
    expect(validation.ok).toBe(false);
    expect(
      validation.issues.some((i) => i.message.includes("Duplicate courseCode")),
    ).toBe(true);
  });

  it("rejects invalid HTTPS URLs", async () => {
    const parsed = await parseCatalogueWorkbook(WORKBOOK);
    parsed.courses[0]!.sourceUrl = "http://insecure.example";
    const validation = validateParsedWorkbook(parsed);
    expect(validation.ok).toBe(false);
    expect(validation.issues.some((i) => i.field === "sourceUrl")).toBe(true);
  });

  it("rejects AQF-implying credential wording", () => {
    expect(credentialImpliesAqf("Statement of Attainment")).toBe(true);
    expect(credentialImpliesAqf(STANDARD_CREDENTIAL_TYPE)).toBe(false);
  });

  it("forces PLANNED publication on import rows", async () => {
    const parsed = await parseCatalogueWorkbook(WORKBOOK);
    const forced = forcePlannedForImport({
      ...parsed.courses[0]!,
      publicationStatus: "PUBLISHED",
    });
    expect(forced.publicationStatus).toBe("PLANNED");
    expect(forced.credentialType).toBe(STANDARD_CREDENTIAL_TYPE);
  });

  it("marks all HIS courses as practical-assessment required", async () => {
    const parsed = await parseCatalogueWorkbook(WORKBOOK);
    const his = parsed.courses.filter((c) => c.schoolCode === "HIS");
    expect(his).toHaveLength(10);
    expect(his.every((c) => c.practicalAssessmentRequired)).toBe(true);
  });
});
