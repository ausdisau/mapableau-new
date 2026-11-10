/**
 * Display-only bridge between RAG and AccessCompatibilityState.
 * Never writes compatibility records or merges vocabularies.
 */
import type { AccessCompatibilityState } from "@/lib/access/infrastructure/domains";

import type { RagStatus } from "./types";

export type CompatibilityBridgeNote = {
  rag: RagStatus;
  suggestedCompatibilityDisplay: AccessCompatibilityState | "no_mapping";
  note: string;
  writesCompatibilityRecord: false;
};

export function bridgeRagToCompatibilityDisplay(
  rag: RagStatus,
): CompatibilityBridgeNote {
  switch (rag) {
    case "green":
      return {
        rag,
        suggestedCompatibilityDisplay: "compatible",
        note: "Display-only suggestion. RAG Green is not an AccessCompatibility write.",
        writesCompatibilityRecord: false,
      };
    case "amber":
      return {
        rag,
        suggestedCompatibilityDisplay: "compatible_with_adjustment",
        note: "Amber conditions ≠ Passport adjustment confirmation.",
        writesCompatibilityRecord: false,
      };
    case "red":
      return {
        rag,
        suggestedCompatibilityDisplay: "incompatible",
        note: "Barrier RAG is not a journey incompatibility decision record.",
        writesCompatibilityRecord: false,
      };
    case "unknown":
      return {
        rag,
        suggestedCompatibilityDisplay: "uncertain",
        note: "Unknown RAG and uncertain compatibility remain distinct concepts.",
        writesCompatibilityRecord: false,
      };
    default: {
      const _exhaustive: never = rag;
      return _exhaustive;
    }
  }
}
