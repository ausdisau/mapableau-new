/**
 * Constants and forbidden credential language for catalogue import.
 */

export const EXPECTED_COURSE_COUNT = 142;
export const EXPECTED_SCHOOL_COUNT = 14;
export const EXPECTED_WAVE_COUNTS = {
  WAVE_1_LAUNCH: 36,
  WAVE_2_EXPANSION: 54,
  WAVE_3_SPECIALIST: 52,
} as const;

export const STANDARD_CREDENTIAL_TYPE =
  "MapAble Academy Certificate of Completion — non-accredited professional development.";

export const HIS_THEORY_LABEL = "Theory component";

export const HIS_PRACTICAL_WARNING =
  "Completion of this online theory component does not make a worker eligible to deliver high-intensity support. Participant-specific training and assessment by an appropriately qualified assessor are required.";

export const FORBIDDEN_CREDENTIAL_PHRASES = [
  "nationally recognised",
  "statement of attainment",
  "certified support worker",
  "guaranteed compliant",
  "ndis-approved course",
  "ndis approved course",
] as const;

/** “accredited” is forbidden unless paired with non-accredited. */
export function credentialImpliesAqf(text: string): boolean {
  const lower = text.toLowerCase();
  if (lower.includes("non-accredited")) {
    // Still flag other banned phrases
    return FORBIDDEN_CREDENTIAL_PHRASES.some((p) => lower.includes(p));
  }
  if (/\bqualification\b/i.test(text) && !/not an?.*qualification/i.test(text)) {
    return true;
  }
  if (/\baccredited\b/i.test(text)) return true;
  return FORBIDDEN_CREDENTIAL_PHRASES.some((p) => lower.includes(p));
}

export const PUBLICATION_STATUS_MAP: Record<string, string> = {
  planned: "PLANNED",
  "in design": "IN_DESIGN",
  "in-design": "IN_DESIGN",
  "in review": "IN_REVIEW",
  "in-review": "IN_REVIEW",
  published: "PUBLISHED",
  retired: "RETIRED",
};

export const LEVEL_MAP: Record<string, string> = {
  foundation: "FOUNDATION",
  intermediate: "INTERMEDIATE",
  advanced: "ADVANCED",
};

export const WAVE_MAP: Record<string, string> = {
  "wave 1 – launch": "WAVE_1_LAUNCH",
  "wave 1 - launch": "WAVE_1_LAUNCH",
  "wave 1 launch": "WAVE_1_LAUNCH",
  "wave 2 – expansion": "WAVE_2_EXPANSION",
  "wave 2 - expansion": "WAVE_2_EXPANSION",
  "wave 2 expansion": "WAVE_2_EXPANSION",
  "wave 3 – specialist": "WAVE_3_SPECIALIST",
  "wave 3 - specialist": "WAVE_3_SPECIALIST",
  "wave 3 specialist": "WAVE_3_SPECIALIST",
};

export type NormalizedCourseRow = {
  courseCode: string;
  schoolCode: string;
  title: string;
  audience: string;
  level: "FOUNDATION" | "INTERMEDIATE" | "ADVANCED";
  durationMinutes: number;
  deliveryFormat: string;
  assessmentType: string;
  credentialType: string;
  reviewCycle: string;
  releaseWave: "WAVE_1_LAUNCH" | "WAVE_2_EXPANSION" | "WAVE_3_SPECIALIST";
  ndisTags: string[];
  sourceUrl: string;
  disclaimer: string;
  publicationStatus: "PLANNED" | "IN_DESIGN" | "IN_REVIEW" | "PUBLISHED" | "RETIRED";
  practicalAssessmentRequired: boolean;
  clinicalReviewRequired: boolean;
  disabilityLedReviewRequired: boolean;
  pathwayBadge: string | null;
  indicativeLearningOutcome: string | null;
  governanceNote: string | null;
  schoolName: string | null;
  rowNumber: number;
};

export type NormalizedSchoolRow = {
  code: string;
  name: string;
  courseCount: number;
  primaryAudience: string;
  pathwayBadge: string;
  purpose: string;
  releasePriority: string;
  displayOrder: number;
};
