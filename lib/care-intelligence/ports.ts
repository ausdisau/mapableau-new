import type {
  ActionIntent,
  CoordinationScenario,
} from "@/lib/care-intelligence/types";

/** Future integration seam. Production adapters must remain participant-scoped. */
export interface ReadOnlyCoordinationPort {
  getSyntheticScenario(id: string): Promise<CoordinationScenario | null>;
}

/** Journals proposed intents only. It cannot execute a booking, message or payment. */
export interface IntentJournalPort {
  record(intents: readonly ActionIntent[]): Promise<void>;
}

// Deliberately no execution port. Adding one requires a separate safety case,
// participant co-design, privacy review and explicit release gate.
