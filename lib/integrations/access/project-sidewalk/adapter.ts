import type {
  AccessEvidenceProvider,
  EvidenceRequest,
  EvidenceResult,
  NormalizedObservation,
  ProviderHealth,
} from "../contracts";
import { openInfrastructureFlags } from "../flags";
import { mapProjectSidewalkLabel } from "./mapper";
import { projectSidewalkLabelSchema } from "./schemas";

export class ProjectSidewalkAdapter implements AccessEvidenceProvider {
  readonly providerId = "project_sidewalk" as const;

  isEnabled(): boolean {
    return openInfrastructureFlags.projectSidewalk;
  }

  async healthCheck(): Promise<ProviderHealth> {
    const checkedAt = new Date().toISOString();
    const baseUrl = process.env.MAPABLE_PROJECT_SIDEWALK_BASE_URL?.trim();
    return {
      providerId: this.providerId,
      configured: Boolean(baseUrl),
      reachable: false,
      latencyMs: null,
      version: null,
      checkedAt,
      message: this.isEnabled()
        ? baseUrl
          ? "Configured — live fetch disabled until pilot activation"
          : "Flag on but MAPABLE_PROJECT_SIDEWALK_BASE_URL missing"
        : "Project Sidewalk flag is OFF",
    };
  }

  async resolveEvidence(request: EvidenceRequest): Promise<EvidenceResult> {
    if (!this.isEnabled()) {
      throw new Error("Project Sidewalk disabled");
    }
    // Live city API fetch is pilot-gated; resolve returns empty until configured fetch is authorised.
    return {
      providerId: this.providerId,
      references: [],
      rawSummary: `Project Sidewalk reference ${request.reference} (no live fetch)`,
    };
  }

  async normalizeObservation(input: unknown): Promise<NormalizedObservation> {
    if (!openInfrastructureFlags.enabled) {
      throw new Error("Open infrastructure disabled");
    }
    // Allow normalisation of provided payloads even when import flag is off,
    // so unit tests and offline fixtures work; persistence remains flag-gated.
    projectSidewalkLabelSchema.parse(input);
    return mapProjectSidewalkLabel(input);
  }
}

export const projectSidewalkAdapter = new ProjectSidewalkAdapter();
