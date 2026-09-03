export type WorkerScreeningConfig = {
  enabled: boolean;
  victoriaEnabled: boolean;
  victoriaBaseUrl?: string;
  victoriaApiKeyConfigured: boolean;
};

function isEnabled(value: string | undefined) {
  return value === "true";
}

export function getWorkerScreeningConfig(): WorkerScreeningConfig {
  return {
    enabled: isEnabled(process.env.MAPABLE_WORKER_SCREENING_QUERY_ENABLED),
    victoriaEnabled: isEnabled(process.env.MAPABLE_WORKER_SCREENING_VIC_ENABLED),
    victoriaBaseUrl: process.env.WORKER_SCREENING_VIC_BASE_URL?.trim() || undefined,
    victoriaApiKeyConfigured: Boolean(process.env.WORKER_SCREENING_VIC_API_KEY?.trim()),
  };
}
