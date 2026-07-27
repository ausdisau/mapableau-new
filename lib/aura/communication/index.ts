import { createHash } from "crypto";

import { auraFlags } from "@/lib/aura/feature-flags";

/** Adaptive presentation — Wave 7 meaning-preserving renders. */

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
  /** Route / presentation steps — must affect meaning hash when directions change. */
  steps?: string[];
  warnings?: string[];
};

/**
 * SHA-256 over a canonical payload including `steps` so adaptive presentation
 * modes reflect changes in route directions.
 */
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
    steps: content.steps,
    warnings: content.warnings,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export function renderContent(input: {
  content: StructuredContent;
  mode: PresentationMode;
}): {
  rendered: string[];
  standardText: string[];
  symbols?: string[];
  meaningHash: string;
  waiAdaptExperimental: boolean;
} {
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
