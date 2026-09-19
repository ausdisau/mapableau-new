import type {
  AccessEvidenceProvider,
  EvidenceRequest,
  EvidenceResult,
  NormalizedObservation,
  ProviderHealth,
} from "../contracts";
import { openInfrastructureFlags } from "../flags";
import { normalizeQuestAnswer } from "@/lib/access/quests/submit";

export class MapableQuestsAdapter implements AccessEvidenceProvider {
  readonly providerId = "mapable_quests" as const;

  isEnabled(): boolean {
    return openInfrastructureFlags.accessQuests;
  }

  async healthCheck(): Promise<ProviderHealth> {
    const checkedAt = new Date().toISOString();
    return {
      providerId: this.providerId,
      configured: true,
      reachable: this.isEnabled(),
      latencyMs: null,
      version: "1",
      checkedAt,
      message: this.isEnabled()
        ? "MapAble Access Quests active"
        : "Access Quests flag is OFF",
    };
  }

  async resolveEvidence(request: EvidenceRequest): Promise<EvidenceResult> {
    if (!this.isEnabled()) {
      throw new Error("Access Quests disabled");
    }
    return {
      providerId: this.providerId,
      references: [],
      rawSummary: `Quest reference ${request.reference}`,
    };
  }

  async normalizeObservation(input: unknown): Promise<NormalizedObservation> {
    return normalizeQuestAnswer(input);
  }
}

export const mapableQuestsAdapter = new MapableQuestsAdapter();
