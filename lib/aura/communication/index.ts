import { createHash } from "crypto";

import { auraFlags } from "../feature-flags";

export type PresentationMode =
  | "standard"
  | "plain_language"
  | "one_step_at_a_time"
  | "large_print"
  | "symbol_supported"
  | "audio"
  | "captions"
  | "supporter_handover"
  | "compact"
  | "low_cognitive_load";

export type SemanticConcept = {
  key: string;
  standardLabel: string;
  plainLanguageLabel: string;
  description: string;
  iconFallback: string;
  waiAdaptRef?: string;
  aacSymbolSetRef?: string;
  locale: string;
  ambiguityWarning?: string;
  criticalAction: boolean;
};

export type StructuredContent = {
  recipient?: string;
  purpose?: string;
  price?: string;
  fieldsShared?: string[];
  fieldsOmitted?: string[];
  blockers?: string[];
  unknowns?: string[];
  routeDirections?: string[];
  risk?: string;
  expiry?: string;
  cancellationConsequence?: string;
  executionState?: string;
  steps?: string[];
  warnings?: string[];
};

const CONCEPTS: SemanticConcept[] = [
  { key: "entrance", standardLabel: "Entrance", plainLanguageLabel: "Doorway in", description: "Building entrance", iconFallback: "🚪", locale: "en-AU", criticalAction: false },
  { key: "lift", standardLabel: "Lift", plainLanguageLabel: "Elevator", description: "Vertical transport", iconFallback: "🛗", locale: "en-AU", criticalAction: false },
  { key: "approve", standardLabel: "Approve", plainLanguageLabel: "Say yes to this", description: "Confirm an action", iconFallback: "✓", locale: "en-AU", criticalAction: true },
  { key: "cancel", standardLabel: "Cancel", plainLanguageLabel: "Stop this", description: "Cancel an action", iconFallback: "✗", locale: "en-AU", criticalAction: true },
  { key: "blocked", standardLabel: "Blocked", plainLanguageLabel: "Cannot use this way", description: "Route or access blocked", iconFallback: "⛔", locale: "en-AU", criticalAction: true },
  { key: "unknown", standardLabel: "Unknown", plainLanguageLabel: "Not sure yet", description: "Information not verified", iconFallback: "?", locale: "en-AU", criticalAction: true },
  { key: "warning", standardLabel: "Warning", plainLanguageLabel: "Important notice", description: "Safety or access warning", iconFallback: "⚠", locale: "en-AU", criticalAction: true },
  { key: "offline", standardLabel: "Offline", plainLanguageLabel: "No internet", description: "Network unavailable", iconFallback: "📴", locale: "en-AU", criticalAction: false },
];

const profiles = new Map<string, { userId: string; mode: PresentationMode; symbolSet?: string }>();

export function resetCommunicationStore(): void {
  profiles.clear();
}

export function getConcept(key: string): SemanticConcept | undefined {
  return CONCEPTS.find((c) => c.key === key);
}

export function listConcepts(): SemanticConcept[] {
  return [...CONCEPTS];
}

export function computeMeaningHash(content: StructuredContent): string {
  const canonical = JSON.stringify({
    recipient: content.recipient,
    purpose: content.purpose,
    price: content.price,
    fieldsShared: content.fieldsShared,
    fieldsOmitted: content.fieldsOmitted,
    blockers: content.blockers,
    unknowns: content.unknowns,
    routeDirections: content.routeDirections,
    risk: content.risk,
    expiry: content.expiry,
    cancellationConsequence: content.cancellationConsequence,
    executionState: content.executionState,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export function renderContent(input: {
  content: StructuredContent;
  mode: PresentationMode;
  userDiagnosis?: string;
}): {
  rendered: string[];
  standardText: string[];
  symbols?: string[];
  meaningHash: string;
  waiAdaptExperimental: boolean;
} {
  void input.userDiagnosis;
  const hash = computeMeaningHash(input.content);
  const steps = input.content.steps ?? input.content.routeDirections ?? [];
  const standardText = steps.length
    ? steps.map((s, i) => `${i + 1}. ${s}`)
    : ["No steps available."];

  switch (input.mode) {
    case "one_step_at_a_time":
      return {
        rendered: standardText,
        standardText,
        meaningHash: hash,
        waiAdaptExperimental: false,
      };
    case "plain_language":
      return {
        rendered: steps.map((s) => s.replace(/Proceed to/gi, "Go to")),
        standardText,
        meaningHash: hash,
        waiAdaptExperimental: false,
      };
    case "symbol_supported":
      if (!auraFlags.waiAdaptEnabled) {
        return {
          rendered: standardText,
          standardText,
          meaningHash: hash,
          waiAdaptExperimental: false,
        };
      }
      return {
        rendered: standardText,
        standardText,
        symbols: steps.map(() => "🚪"),
        meaningHash: hash,
        waiAdaptExperimental: true,
      };
  case "large_print":
  case "standard":
  case "audio":
  case "captions":
  case "supporter_handover":
  case "compact":
  case "low_cognitive_load":
    return {
      rendered: standardText,
      standardText,
      meaningHash: hash,
      waiAdaptExperimental: false,
    };
    default: {
      const _exhaustive: never = input.mode;
      throw new Error(`Unknown presentation mode: ${_exhaustive}`);
    }
  }
}

export function assertCriticalActionHasText(
  conceptKey: string,
  rendered: { standardText: string[]; symbols?: string[] },
): void {
  const concept = getConcept(conceptKey);
  if (!concept?.criticalAction) return;
  if (!rendered.standardText.length) {
    throw new Error("AURA_CRITICAL_ACTION_TEXT_REQUIRED");
  }
  if (rendered.symbols?.length && !rendered.standardText.length) {
    throw new Error("AURA_SYMBOL_ONLY_CRITICAL_ACTION");
  }
}

export function setCommunicationProfile(input: {
  userId: string;
  mode: PresentationMode;
  symbolSet?: string;
}): void {
  profiles.set(input.userId, input);
}

export function getCommunicationProfile(userId: string): {
  mode: PresentationMode;
  symbolSet?: string;
} {
  return profiles.get(userId) ?? { mode: "standard" };
}

export function assertModeNotInferredFromDiagnosis(
  mode: PresentationMode,
  _diagnosis?: string,
): void {
  void mode;
  void _diagnosis;
}
