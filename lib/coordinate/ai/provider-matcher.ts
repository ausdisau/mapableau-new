import { buildAiMeta } from "@/lib/coordinate/ai/escalation";

export type ProviderMatchInput = {
  sourceId: string;
  providerName: string;
  suburb?: string | null;
  state?: string | null;
  services?: string[];
  registrationGroups?: string[];
};

export type ProviderMatchResult = {
  ndisProviderId: string;
  providerName: string;
  matchScore: number;
  matchReason: string;
  conflictFlags: string[];
  confidence: number;
};

export function rankProviders(params: {
  providers: ProviderMatchInput[];
  needDescription: string;
  participantSuburb?: string | null;
}): { items: ProviderMatchResult[]; meta: ReturnType<typeof buildAiMeta> } {
  const need = params.needDescription.toLowerCase();

  const items = params.providers
    .map((provider) => {
      const services = (provider.services ?? []).join(" ").toLowerCase();
      const groups = (provider.registrationGroups ?? []).join(" ").toLowerCase();
      let score = 0.35;
      const reasons: string[] = [];
      const conflictFlags: string[] = [];

      if (services.includes("community") || groups.includes("community")) {
        score += 0.25;
        reasons.push("Offers community participation supports");
      }
      if (need.includes("therapy") && /therapy|allied health/i.test(services)) {
        score += 0.2;
        reasons.push("Allied health services align with stated need");
      }
      if (
        params.participantSuburb &&
        provider.suburb?.toLowerCase() === params.participantSuburb.toLowerCase()
      ) {
        score += 0.15;
        reasons.push("Located in participant suburb");
      }

      if (/conflict|related party/i.test(services)) {
        conflictFlags.push("potential_conflict_of_interest");
        score -= 0.2;
      }

      const confidence = Math.min(score, 0.7);
      return {
        ndisProviderId: provider.sourceId,
        providerName: provider.providerName,
        matchScore: Number(score.toFixed(2)),
        matchReason: reasons.join(". ") || "General directory match",
        conflictFlags,
        confidence,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 8);

  const avg =
    items.length > 0
      ? items.reduce((s, i) => s + i.confidence, 0) / items.length
      : 0.4;

  return {
    items,
    meta: buildAiMeta({
      confidence: avg,
      reason: `Ranked ${items.length} provider(s) using rule-based NDIS directory matching.`,
    }),
  };
}
