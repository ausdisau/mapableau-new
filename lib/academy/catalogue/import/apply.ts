import type { Prisma } from "@prisma/client";

import { recordAcademyAudit } from "@/lib/academy/audit";
import {
  HIS_PRACTICAL_WARNING,
  STANDARD_CREDENTIAL_TYPE,
} from "@/lib/academy/catalogue/import/constants";
import type { ParsedWorkbook } from "@/lib/academy/catalogue/import/parse-workbook";
import {
  forcePlannedForImport,
  slugifyCourse,
  type ImportIssue,
  type ValidationResult,
} from "@/lib/academy/catalogue/import/validate";
import { prisma } from "@/lib/prisma";

export type ApplyOptions = {
  dryRun: boolean;
  validateOnly?: boolean;
  schoolFilter?: string;
  waveFilter?: "WAVE_1_LAUNCH" | "WAVE_2_EXPANSION" | "WAVE_3_SPECIALIST";
  initiatedBy?: string;
};

export type ApplyResult = {
  dryRun: boolean;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  rejectedCount: number;
  issues: ImportIssue[];
  importRunId?: string;
  preview: Array<{
    courseCode: string;
    action: "create" | "update" | "unchanged" | "reject";
    reason?: string;
  }>;
};

function tagCode(label: string): string {
  return label
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
}

export async function applyCatalogueImport(
  parsed: ParsedWorkbook,
  validation: ValidationResult,
  opts: ApplyOptions,
): Promise<ApplyResult> {
  const preview: ApplyResult["preview"] = [];
  let createdCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let rejectedCount = 0;

  const courses = parsed.courses
    .map(forcePlannedForImport)
    .filter((c) => !opts.schoolFilter || c.schoolCode === opts.schoolFilter)
    .filter((c) => !opts.waveFilter || c.releaseWave === opts.waveFilter);

  if (opts.validateOnly || !validation.ok || opts.dryRun) {
    for (const c of courses) {
      const existing = await prisma.course.findUnique({ where: { code: c.courseCode } });
      if (!existing) {
        preview.push({ courseCode: c.courseCode, action: "create" });
        createdCount += 1;
      } else if (
        existing.publicationStatus === "PUBLISHED" ||
        existing.publicationStatus === "RETIRED"
      ) {
        preview.push({
          courseCode: c.courseCode,
          action: "reject",
          reason: `Cannot overwrite ${existing.publicationStatus} course via catalogue import`,
        });
        rejectedCount += 1;
      } else {
        const same =
          existing.title === c.title &&
          existing.durationMinutes === c.durationMinutes &&
          existing.primaryAudience === c.audience;
        if (same) {
          preview.push({ courseCode: c.courseCode, action: "unchanged" });
          unchangedCount += 1;
        } else {
          preview.push({ courseCode: c.courseCode, action: "update" });
          updatedCount += 1;
        }
      }
    }

    // Spec: dry-run / validate-only must not write (including import-run rows).
    return {
      dryRun: true,
      createdCount,
      updatedCount,
      unchangedCount,
      rejectedCount,
      issues: validation.issues,
      preview,
    };
  }

  // Fail closed — should never reach here with errors
  if (!validation.ok) {
    throw new Error("Cannot apply import with validation errors");
  }

  const result = await prisma.$transaction(async (tx) => {
    let created = 0;
    let updated = 0;
    let unchanged = 0;
    let rejected = 0;
    const actions: ApplyResult["preview"] = [];

    for (const [idx, school] of parsed.schools.entries()) {
      await tx.academySchool.upsert({
        where: { code: school.code },
        create: {
          code: school.code,
          name: school.name,
          purpose: school.purpose,
          primaryAudience: school.primaryAudience,
          pathwayBadge: school.pathwayBadge,
          displayOrder: school.displayOrder || idx + 1,
          status: "active",
          description: school.purpose,
        },
        update: {
          name: school.name,
          purpose: school.purpose,
          primaryAudience: school.primaryAudience,
          pathwayBadge: school.pathwayBadge,
          displayOrder: school.displayOrder || idx + 1,
          description: school.purpose,
        },
      });

      const pathSlug = school.code.toLowerCase();
      await tx.learningPath.upsert({
        where: { slug: pathSlug },
        create: {
          slug: pathSlug,
          code: school.code,
          title: school.name,
          description: school.purpose,
          badgeName: school.pathwayBadge,
          audience: school.primaryAudience,
          schoolId: (await tx.academySchool.findUniqueOrThrow({ where: { code: school.code } })).id,
          status: "draft",
        },
        update: {
          code: school.code,
          title: school.name,
          description: school.purpose,
          badgeName: school.pathwayBadge,
          audience: school.primaryAudience,
          schoolId: (await tx.academySchool.findUniqueOrThrow({ where: { code: school.code } })).id,
        },
      });
    }

    for (const c of courses) {
      const school = await tx.academySchool.findUniqueOrThrow({
        where: { code: c.schoolCode },
      });
      const existing = await tx.course.findUnique({
        where: { code: c.courseCode },
        include: { versions: { where: { isImmutable: true }, take: 1 } },
      });

      if (existing?.publicationStatus === "PUBLISHED" || existing?.publicationStatus === "RETIRED") {
        actions.push({
          courseCode: c.courseCode,
          action: "reject",
          reason: `Cannot overwrite ${existing.publicationStatus}`,
        });
        rejected += 1;
        continue;
      }
      if (existing?.versions.length) {
        actions.push({
          courseCode: c.courseCode,
          action: "reject",
          reason: "Immutable published CourseVersion present",
        });
        rejected += 1;
        continue;
      }

      const data = {
        title: c.title,
        summary: c.indicativeLearningOutcome,
        schoolId: school.id,
        primaryAudience: c.audience,
        level: c.level,
        deliveryFormat: c.deliveryFormat,
        durationMinutes: c.durationMinutes,
        assessmentType: c.assessmentType,
        credentialType: STANDARD_CREDENTIAL_TYPE,
        suggestedReviewCycle: c.reviewCycle,
        practicalAssessmentRequired: c.practicalAssessmentRequired,
        clinicalReviewRequired: c.clinicalReviewRequired,
        disabilityLedReviewRequired: c.disabilityLedReviewRequired,
        releaseWave: c.releaseWave,
        publicationStatus: "PLANNED" as const,
        indicativeLearningOutcome: c.indicativeLearningOutcome,
        governanceNote:
          c.schoolCode === "HIS"
            ? `${c.governanceNote ?? ""}\n${HIS_PRACTICAL_WARNING}`.trim()
            : c.governanceNote,
        pathwayBadge: c.pathwayBadge,
      };

      if (!existing) {
        const course = await tx.course.create({
          data: {
            code: c.courseCode,
            slug: slugifyCourse(c.courseCode, c.title),
            ...data,
          },
        });
        await tx.academyCourseSource.create({
          data: {
            courseId: course.id,
            sourceUrl: c.sourceUrl,
            sourceTitle: "Authoritative public source",
            sourceType: "https",
            retrievedAt: new Date(),
          },
        });
        for (const tagLabel of c.ndisTags) {
          const code = tagCode(tagLabel);
          const tag = await tx.academyFrameworkTag.upsert({
            where: { code },
            create: {
              code,
              label: tagLabel,
              framework: "NDIS / MapAble catalogue",
            },
            update: { label: tagLabel },
          });
          await tx.academyCourseFrameworkTag.upsert({
            where: {
              courseId_frameworkTagId: {
                courseId: course.id,
                frameworkTagId: tag.id,
              },
            },
            create: { courseId: course.id, frameworkTagId: tag.id },
            update: {},
          });
        }

        const path = await tx.learningPath.findUnique({ where: { code: c.schoolCode } });
        if (path) {
          await tx.learningPathCourse.upsert({
            where: {
              learningPathId_courseId: {
                learningPathId: path.id,
                courseId: course.id,
              },
            },
            create: {
              learningPathId: path.id,
              courseId: course.id,
              sortOrder: Number(c.courseCode.split("-")[1] || 0),
              required: true,
            },
            update: {},
          });
        }

        actions.push({ courseCode: c.courseCode, action: "create" });
        created += 1;
      } else {
        const same =
          existing.title === data.title &&
          existing.durationMinutes === data.durationMinutes &&
          existing.primaryAudience === data.primaryAudience &&
          existing.deliveryFormat === data.deliveryFormat &&
          existing.releaseWave === data.releaseWave;

        if (same) {
          actions.push({ courseCode: c.courseCode, action: "unchanged" });
          unchanged += 1;
        } else {
          await tx.course.update({
            where: { id: existing.id },
            data,
          });
          actions.push({ courseCode: c.courseCode, action: "update" });
          updated += 1;
        }
      }
    }

    const run = await tx.curriculumImportRun.create({
      data: {
        sourceFilename: parsed.sourceFilename,
        sourceChecksum: parsed.checksum,
        dryRun: false,
        initiatedBy: opts.initiatedBy,
        createdCount: created,
        updatedCount: updated,
        unchangedCount: unchanged,
        rejectedCount: rejected,
        result: "applied",
        reportJson: { preview: actions } as Prisma.InputJsonValue,
        issues: {
          create: validation.issues.map((i) => ({
            sheet: i.sheet,
            rowNumber: i.rowNumber,
            courseCode: i.courseCode,
            severity: i.severity,
            field: i.field,
            message: i.message,
          })),
        },
      },
    });

    return { created, updated, unchanged, rejected, actions, runId: run.id };
  });

  await recordAcademyAudit({
    actorUserId:
      opts.initiatedBy && /^c[a-z0-9]{20,}$/i.test(opts.initiatedBy)
        ? opts.initiatedBy
        : null,
    action: "academy.catalogue.import.applied",
    entityType: "CurriculumImportRun",
    entityId: result.runId,
    metadata: {
      checksum: parsed.checksum,
      createdCount: result.created,
      updatedCount: result.updated,
      unchangedCount: result.unchanged,
      rejectedCount: result.rejected,
      initiatedByLabel: opts.initiatedBy ?? "unknown",
    },
  });

  return {
    dryRun: false,
    createdCount: result.created,
    updatedCount: result.updated,
    unchangedCount: result.unchanged,
    rejectedCount: result.rejected,
    issues: validation.issues,
    importRunId: result.runId,
    preview: result.actions,
  };
}
