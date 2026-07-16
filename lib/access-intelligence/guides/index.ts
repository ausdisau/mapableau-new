/**
 * System 3 — Venue Access Guide generator.
 * AI may draft language; every factual sentence must bind to approved evidence.
 * Unknowns stay unknown. No legal compliance claims.
 */

import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";

export type GuideFact = {
  sentenceKey: string;
  text: string;
  evidenceLabel: string;
  evidenceAssetId?: string;
  claimId?: string;
  sourceKind: "assessor" | "venue_attestation" | "community" | "live_incident" | "unknown";
};

export type GuideSectionDraft = {
  heading: string;
  facts: GuideFact[];
};

export class FactBinderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FactBinderError";
  }
}

const FORBIDDEN_CLAIMS =
  /\b(compliant|compliance|meets\s+(all\s+)?(disability|building|ndis)\s+standards?|legally\s+accessible)\b/i;

/**
 * Rejects unbound or invented factual sentences and legal compliance claims.
 */
export function bindGuideFacts(sections: GuideSectionDraft[]): {
  sections: GuideSectionDraft[];
  evidenceReferences: Array<{
    sentenceKey: string;
    label: string;
    evidenceAssetId?: string;
    claimId?: string;
  }>;
} {
  const evidenceReferences: Array<{
    sentenceKey: string;
    label: string;
    evidenceAssetId?: string;
    claimId?: string;
  }> = [];

  for (const section of sections) {
    for (const fact of section.facts) {
      if (FORBIDDEN_CLAIMS.test(fact.text)) {
        throw new FactBinderError(
          `Legal compliance claim rejected in sentence ${fact.sentenceKey}.`,
        );
      }
      if (fact.sourceKind === "unknown") {
        if (!/unknown|not\s+verified|no\s+evidence/i.test(fact.text)) {
          throw new FactBinderError(
            `Unknown facts must remain labelled unknown (${fact.sentenceKey}).`,
          );
        }
      } else if (!fact.evidenceAssetId && !fact.claimId) {
        throw new FactBinderError(
          `Factual sentence ${fact.sentenceKey} has no evidence binding.`,
        );
      }
      evidenceReferences.push({
        sentenceKey: fact.sentenceKey,
        label: `${fact.sourceKind}: ${fact.evidenceLabel}`,
        evidenceAssetId: fact.evidenceAssetId,
        claimId: fact.claimId,
      });
    }
  }

  return { sections, evidenceReferences };
}

export function renderGuideHtml(input: {
  title: string;
  sections: GuideSectionDraft[];
  plainLanguage?: boolean;
}): string {
  const body = input.sections
    .map((s) => {
      const paras = s.facts
        .map(
          (f) =>
            `<p data-sentence-key="${escapeHtml(f.sentenceKey)}">${escapeHtml(f.text)} <small>(${escapeHtml(f.evidenceLabel)})</small></p>`,
        )
        .join("\n");
      return `<section><h2>${escapeHtml(s.heading)}</h2>${paras}</section>`;
    })
    .join("\n");
  return `<!DOCTYPE html><html lang="en-AU"><head><meta charset="utf-8"/><title>${escapeHtml(input.title)}</title></head><body><h1>${escapeHtml(input.title)}</h1>${body}</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function assertGuideGeneratorEnabled(): void {
  if (!accessIntelligenceFlags.guideGenerator) {
    throw new Error("Guide generator disabled.");
  }
}
