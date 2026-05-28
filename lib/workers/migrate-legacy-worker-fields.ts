/** Maps legacy Worker row fields into WorkerProfile create/update payload. */
export function mapLegacyWorkerToProfileFields(worker: {
  id: string;
  bio: string | null;
  qualifications: string | null;
  languages?: { name: string }[];
  specialisations?: { name: string }[];
}) {
  return {
    legacyWorkerId: worker.id,
    profileSummary: worker.bio,
    qualificationsSummary: worker.qualifications,
    languages: worker.languages?.map((l) => l.name) ?? [],
    specialisations: worker.specialisations?.map((s) => s.name) ?? [],
  };
}

