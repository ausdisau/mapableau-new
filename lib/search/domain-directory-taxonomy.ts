/**
 * Search taxonomy for public, read-only Employment and Rehabilitation directories.
 * Categories describe imported source classifications, NOT professional registration,
 * actual availability, funding eligibility, service quality or clinical suitability.
 */
export type DirectoryDomain = "jobs" | "rehabilitation";
export type DirectorySource = "providers" | "jobs" | "both";

export type DirectoryCategoryDefinition = {
  id: string;
  label: string;
  source: DirectorySource;
  description: string;
  registrationGroups: readonly string[];
  serviceLabels: readonly string[];
};

const EMPLOYMENT_GROUPS = [
  "Assistance to access and/or maintain employment and/or education",
  "Specialised Supported Employment",
] as const;
const THERAPY_GROUPS = ["Therapeutic Supports"] as const;

export const DIRECTORY_CATEGORIES = {
  jobs: [
    {
      id: "all", label: "All employment pathways", source: "both",
      description: "Employer-published vacancies and imported employment support outlets.",
      registrationGroups: EMPLOYMENT_GROUPS,
      serviceLabels: ["Employment Supports"],
    },
    {
      id: "job_vacancies", label: "Job vacancies", source: "jobs",
      description: "Published jobs from explicitly approved employer organisations.",
      registrationGroups: [], serviceLabels: [],
    },
    {
      id: "workplace_adjustments", label: "Jobs describing adjustments", source: "jobs",
      description: "Employer-published listings that include an adjustment statement; claims are not independently verified.",
      registrationGroups: [], serviceLabels: [],
    },
    {
      id: "employment_support", label: "Employment support services", source: "providers",
      description: "Imported employment-support directory classifications, not verified service vacancies.",
      registrationGroups: EMPLOYMENT_GROUPS,
      serviceLabels: ["Employment Supports"],
    },
  ],
  rehabilitation: [
    {
      id: "all", label: "All therapy and rehabilitation", source: "providers",
      description: "Imported therapeutic support classifications, not confirmed rehabilitation programmes.",
      registrationGroups: THERAPY_GROUPS,
      serviceLabels: [
        "Occupational Therapist", "Physiotherapist", "Speech Pathologist",
        "Exercise Physiologist", "Psychologist",
      ],
    },
    {
      id: "therapy", label: "Therapy and allied health", source: "providers",
      description: "Broad therapeutic-support classifications from the provider directory.",
      registrationGroups: THERAPY_GROUPS,
      serviceLabels: [
        "Occupational Therapist", "Physiotherapist", "Speech Pathologist",
        "Exercise Physiologist", "Psychologist",
      ],
    },
    {
      id: "occupational_therapy", label: "Occupational therapy", source: "providers",
      description: "Outlets with an occupational-therapy service label in the imported record.",
      registrationGroups: [], serviceLabels: ["Occupational Therapist"],
    },
    {
      id: "physiotherapy", label: "Physiotherapy", source: "providers",
      description: "Outlets with a physiotherapy service label in the imported record.",
      registrationGroups: [], serviceLabels: ["Physiotherapist"],
    },
    {
      id: "speech_pathology", label: "Speech pathology", source: "providers",
      description: "Outlets with a speech-pathology service label in the imported record.",
      registrationGroups: [], serviceLabels: ["Speech Pathologist"],
    },
    {
      id: "exercise_physiology", label: "Exercise physiology", source: "providers",
      description: "Outlets with an exercise-physiology service label in the imported record.",
      registrationGroups: [], serviceLabels: ["Exercise Physiologist"],
    },
    {
      id: "psychology", label: "Psychology", source: "providers",
      description: "Outlets with a psychology service label in the imported record.",
      registrationGroups: [], serviceLabels: ["Psychologist"],
    },
  ],
} as const satisfies Record<DirectoryDomain, readonly DirectoryCategoryDefinition[]>;

export type DirectoryCategoryId =
  (typeof DIRECTORY_CATEGORIES)[DirectoryDomain][number]["id"];

export function categoriesForDomain(domain: DirectoryDomain): readonly DirectoryCategoryDefinition[] {
  return DIRECTORY_CATEGORIES[domain];
}

export function directoryCategory(
  domain: DirectoryDomain,
  requested: string | undefined,
): DirectoryCategoryDefinition {
  const categories: readonly DirectoryCategoryDefinition[] = DIRECTORY_CATEGORIES[domain];
  return categories.find((item) => item.id === requested) ?? categories[0]!;
}

export function domainForCategory(categoryId: string): DirectoryDomain | undefined {
  if (!categoryId || categoryId === "all") return undefined;
  for (const domain of ["jobs", "rehabilitation"] as const) {
    if (DIRECTORY_CATEGORIES[domain].some((item) => item.id === categoryId)) return domain;
  }
  return undefined;
}

export function isValidCategoryFilter(
  vertical: string,
  category: string | undefined,
): boolean {
  if (!category || category === "all") return true;
  const domain = domainForCategory(category);
  return Boolean(domain) && (vertical === "all" || vertical === domain);
}

export function directoryRoute(domain: DirectoryDomain): string {
  return domain === "jobs" ? "/employment/directory" : "/moves/directory";
}

export function categoryAllowsSource(
  category: DirectoryCategoryDefinition,
  source: "providers" | "jobs",
): boolean {
  return category.source === "both" || category.source === source;
}
