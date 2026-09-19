import {
  assessWorkerScreening,
  workerScreeningQuerySchema,
  type WorkerScreeningAssessment,
  type WorkerScreeningQuery,
} from "@mapable/domain-workforce";

import { getWorkerScreeningConfig } from "@/lib/config/worker-screening";
import {
  WorkerScreeningProviderNotConfiguredError,
  type WorkerScreeningProvider,
  type WorkerScreeningProviderHealth,
} from "@/lib/workforce/screening/provider";
import {
  getWorkerScreeningPathway,
  type WorkerScreeningPathway,
} from "@/lib/workforce/screening/pathways";
import { getWorkerScreeningProvider } from "@/lib/workforce/screening/registry";

export type WorkerScreeningQueryReport = {
  checkedAt: string;
  querySummary: {
    jurisdiction: WorkerScreeningQuery["jurisdiction"];
    hasWorkerName: boolean;
    hasScreeningId: boolean;
    hasDateOfBirth: boolean;
    hasEmployerProviderName: boolean;
    hasEmployerAbn: boolean;
  };
  pathway: WorkerScreeningPathway | null;
  providerHealth: WorkerScreeningProviderHealth | null;
  assessment: WorkerScreeningAssessment;
  notes: string[];
};

type QueryServiceOptions = {
  enabled?: boolean;
  provider?: WorkerScreeningProvider;
};

function summariseQuery(query: WorkerScreeningQuery) {
  return {
    jurisdiction: query.jurisdiction,
    hasWorkerName: Boolean(query.workerName),
    hasScreeningId: Boolean(query.screeningId),
    hasDateOfBirth: Boolean(query.dateOfBirth),
    hasEmployerProviderName: Boolean(query.employerProviderName),
    hasEmployerAbn: Boolean(query.employerAbn),
  };
}

function unavailableAssessment(reasonCode: string): WorkerScreeningAssessment {
  return {
    status: "unable_to_verify",
    canTreatAsCleared: false,
    requiresHumanReview: true,
    reasonCodes: [reasonCode],
    evidence: [],
  };
}

export async function runWorkerScreeningQuery(
  input: unknown,
  options: QueryServiceOptions = {},
): Promise<WorkerScreeningQueryReport> {
  const query = workerScreeningQuerySchema.parse(input);
  const checkedAt = new Date().toISOString();
  const enabled = options.enabled ?? getWorkerScreeningConfig().enabled;
  const pathway = query.jurisdiction
    ? getWorkerScreeningPathway(query.jurisdiction)
    : null;

  if (!enabled) {
    return {
      checkedAt,
      querySummary: summariseQuery(query),
      pathway,
      providerHealth: null,
      assessment: unavailableAssessment("WORKER_SCREENING_QUERY_DISABLED"),
      notes: [
        "Worker screening query capability is disabled. No government system was queried.",
      ],
    };
  }

  if (!query.jurisdiction) {
    return {
      checkedAt,
      querySummary: summariseQuery(query),
      pathway: null,
      providerHealth: null,
      assessment: unavailableAssessment("WORKER_SCREENING_JURISDICTION_REQUIRED"),
      notes: [
        "Choose the worker screening jurisdiction for a jurisdiction-specific lookup, or use authorised NDIS Worker Screening Database access directly.",
      ],
    };
  }

  const provider = options.provider ?? getWorkerScreeningProvider(query.jurisdiction);
  if (!provider) {
    return {
      checkedAt,
      querySummary: summariseQuery(query),
      pathway,
      providerHealth: null,
      assessment: unavailableAssessment("WORKER_SCREENING_PATHWAY_ONLY"),
      notes: [
        "No MapAble API connector is configured for this jurisdiction. Use the official worker screening unit or authorised NDIS Worker Screening Database pathway.",
      ],
    };
  }

  const providerHealth = await provider.healthCheck();
  if (!providerHealth.configured || !providerHealth.liveTransportEnabled) {
    return {
      checkedAt,
      querySummary: summariseQuery(query),
      pathway,
      providerHealth,
      assessment: unavailableAssessment("WORKER_SCREENING_PROVIDER_NOT_READY"),
      notes: [
        "The jurisdiction adapter exists but live status transport is not ready. No clearance inference was made.",
      ],
    };
  }

  try {
    const evidence = await provider.queryStatus(query);
    return {
      checkedAt,
      querySummary: summariseQuery(query),
      pathway,
      providerHealth,
      assessment: assessWorkerScreening({ evidence }),
      notes: [],
    };
  } catch (error) {
    if (error instanceof WorkerScreeningProviderNotConfiguredError) {
      return {
        checkedAt,
        querySummary: summariseQuery(query),
        pathway,
        providerHealth,
        assessment: unavailableAssessment("WORKER_SCREENING_PROVIDER_NOT_CONFIGURED"),
        notes: [
          "The worker screening provider is not configured for live status queries.",
        ],
      };
    }

    return {
      checkedAt,
      querySummary: summariseQuery(query),
      pathway,
      providerHealth,
      assessment: unavailableAssessment("WORKER_SCREENING_PROVIDER_UNAVAILABLE"),
      notes: [
        "The authoritative screening provider could not be queried. Treat the worker as unverified until authoritative evidence is obtained.",
      ],
    };
  }
}
