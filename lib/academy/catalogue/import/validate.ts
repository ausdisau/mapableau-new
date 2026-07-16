import {
  EXPECTED_COURSE_COUNT,
  EXPECTED_SCHOOL_COUNT,
  EXPECTED_WAVE_COUNTS,
  credentialImpliesAqf,
  HIS_PRACTICAL_WARNING,
  STANDARD_CREDENTIAL_TYPE,
  type NormalizedCourseRow,
} from "@/lib/academy/catalogue/import/constants";
import type { ParsedWorkbook } from "@/lib/academy/catalogue/import/parse-workbook";

export type ImportIssue = {
  sheet?: string;
  rowNumber?: number;
  courseCode?: string;
  severity: "error" | "warning" | "info";
  field?: string;
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  issues: ImportIssue[];
};

function issue(
  partial: Omit<ImportIssue, "severity"> & { severity?: ImportIssue["severity"] },
): ImportIssue {
  return { severity: partial.severity ?? "error", ...partial };
}

export function validateParsedWorkbook(parsed: ParsedWorkbook): ValidationResult {
  const issues: ImportIssue[] = [];

  if (parsed.schools.length !== EXPECTED_SCHOOL_COUNT) {
    issues.push(
      issue({
        sheet: "Pathways",
        message: `School count ${parsed.schools.length} differs from expected ${EXPECTED_SCHOOL_COUNT}`,
      }),
    );
  }

  if (parsed.courses.length !== EXPECTED_COURSE_COUNT) {
    issues.push(
      issue({
        sheet: "Cursor Seed",
        message: `Course count ${parsed.courses.length} differs from expected ${EXPECTED_COURSE_COUNT}`,
      }),
    );
  }

  const schoolCodes = new Set(parsed.schools.map((s) => s.code));
  for (const s of parsed.schools) {
    if (!s.code || !/^[A-Z]{3}$/.test(s.code)) {
      issues.push(
        issue({
          sheet: "Pathways",
          field: "schoolCode",
          message: `Invalid school code "${s.code}"`,
        }),
      );
    }
  }

  const seen = new Set<string>();
  const waveCounts: Record<string, number> = {
    WAVE_1_LAUNCH: 0,
    WAVE_2_EXPANSION: 0,
    WAVE_3_SPECIALIST: 0,
  };

  for (const c of parsed.courses) {
    const base = {
      sheet: "Cursor Seed",
      rowNumber: c.rowNumber,
      courseCode: c.courseCode,
    };

    if (!c.courseCode) {
      issues.push(issue({ ...base, field: "courseCode", message: "courseCode is missing" }));
      continue;
    }
    if (seen.has(c.courseCode)) {
      issues.push(
        issue({ ...base, field: "courseCode", message: `Duplicate courseCode ${c.courseCode}` }),
      );
    }
    seen.add(c.courseCode);

    if (!schoolCodes.has(c.schoolCode)) {
      issues.push(
        issue({
          ...base,
          field: "schoolCode",
          message: `schoolCode ${c.schoolCode} does not exist in Pathways`,
        }),
      );
    }

    if (!Number.isInteger(c.durationMinutes) || c.durationMinutes <= 0) {
      issues.push(
        issue({
          ...base,
          field: "durationMinutes",
          message: "durationMinutes must be a positive integer",
        }),
      );
    }

    if (!/^https:\/\//i.test(c.sourceUrl)) {
      issues.push(
        issue({
          ...base,
          field: "sourceUrl",
          message: "sourceUrl must be an HTTPS URL",
        }),
      );
    }

    if (!(c.publicationStatus in { PLANNED: 1, IN_DESIGN: 1, IN_REVIEW: 1, PUBLISHED: 1, RETIRED: 1 })) {
      issues.push(
        issue({
          ...base,
          field: "publicationStatus",
          message: `publicationStatus ${c.publicationStatus} is outside controlled vocabulary`,
        }),
      );
    }

    // Re-check raw maps are valid
    if (!(c.level in { FOUNDATION: 1, INTERMEDIATE: 1, ADVANCED: 1 })) {
      issues.push(issue({ ...base, field: "level", message: `Invalid level ${c.level}` }));
    }
    if (!(c.releaseWave in waveCounts)) {
      issues.push(
        issue({ ...base, field: "releaseWave", message: `Invalid releaseWave ${c.releaseWave}` }),
      );
    } else {
      waveCounts[c.releaseWave]! += 1;
    }

    if (credentialImpliesAqf(c.credentialType)) {
      issues.push(
        issue({
          ...base,
          field: "credentialType",
          message: "Credential wording implies AQF recognition or forbidden claims",
        }),
      );
    }

    if (!c.disabilityLedReviewRequired) {
      issues.push(
        issue({
          ...base,
          field: "disabilityLedReviewRequired",
          message: "Disability-led review must be required before publication",
        }),
      );
    }

    if (c.schoolCode === "HIS") {
      if (!c.practicalAssessmentRequired) {
        issues.push(
          issue({
            ...base,
            field: "practicalAssessmentRequired",
            message: "High-intensity courses must require practical assessment",
          }),
        );
      }
      const blob = `${c.disclaimer} ${c.governanceNote ?? ""} ${HIS_PRACTICAL_WARNING}`.toLowerCase();
      if (
        !blob.includes("participant-specific") &&
        !blob.includes("qualified assessor") &&
        !blob.includes("does not guarantee")
      ) {
        issues.push(
          issue({
            ...base,
            severity: "warning",
            field: "disclaimer",
            message:
              "HIS course should carry practical-assessment / non-eligibility disclaimer language",
          }),
        );
      }
    }
  }

  for (const [wave, expected] of Object.entries(EXPECTED_WAVE_COUNTS)) {
    const actual = waveCounts[wave] ?? 0;
    if (actual !== expected) {
      issues.push(
        issue({
          sheet: "Cursor Seed",
          field: "releaseWave",
          message: `Wave total for ${wave} is ${actual}, expected ${expected}`,
        }),
      );
    }
  }

  const errors = issues.filter((i) => i.severity === "error");
  return { ok: errors.length === 0, issues };
}

/** Force import publication status to PLANNED unless preserving an existing published record. */
export function forcePlannedForImport(
  row: NormalizedCourseRow,
): NormalizedCourseRow {
  return {
    ...row,
    publicationStatus: "PLANNED",
    credentialType: STANDARD_CREDENTIAL_TYPE,
  };
}

export function slugifyCourse(code: string, title: string): string {
  const base = `${code}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return base || code.toLowerCase();
}
