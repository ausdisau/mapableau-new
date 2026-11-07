import {
  PROHIBITED_ACTION_PATTERNS,
  SYNTHETIC_BREAKFAST_CONTINUITY_TURN,
  SYNTHETIC_CLARIFY_TURN,
  SYNTHETIC_DRAFT_TURN,
  SYNTHETIC_FALLBACK_TURN,
  SYNTHETIC_PRIVATE_SEARCH_DENIED_TURN,
  SYNTHETIC_PUBLIC_INFO_TURN,
  SYNTHETIC_PUBLIC_SEARCH_TURN,
  SYNTHETIC_REFUSAL_TURN,
  SYNTHETIC_UNCERTAIN_TURN,
} from "@/lib/virtual-persona/fixtures";
import { searchPublicDirectory } from "@/lib/virtual-persona/public-search";
import type { PersonaTurn } from "@/lib/virtual-persona/types";
import { validatePersonaTurn } from "@/lib/virtual-persona/validate-turn";

export type SyntheticAdapterInput = {
  turnId: string;
  message: string;
  useAiAssistance: boolean;
  /** Deterministic clock for tests */
  now?: Date;
};

export type SyntheticAdapterResult =
  | { ok: true; turn: PersonaTurn; latencyMs: number }
  | { ok: false; reason: "adapter_unavailable" | "invalid_response"; latencyMs: number };

/**
 * Deterministic fixture adapter — never calls a live model or private RAG.
 * Labels responses as synthetic; actionAuthority is always none after validation.
 */
export async function generateSyntheticPersonaTurn(
  input: SyntheticAdapterInput,
): Promise<SyntheticAdapterResult> {
  const started = Date.now();
  const message = input.message.trim();

  if (!input.useAiAssistance) {
    const turn = SYNTHETIC_FALLBACK_TURN(input.turnId);
    return finalize(turn, started);
  }

  if (message.length < 2) {
    return finalize(SYNTHETIC_CLARIFY_TURN(input.turnId), started);
  }

  const lower = message.toLowerCase();

  // Continuity scenario before generic prohibited matches so "do not contact
  // my family" is preserved as an exclusion, not treated as a contact request.
  if (
    lower.includes("breakfast") ||
    (lower.includes("packaging") && lower.includes("worker")) ||
    (lower.includes("morning support") && lower.includes("not arrived"))
  ) {
    return finalize(SYNTHETIC_BREAKFAST_CONTINUITY_TURN(input.turnId), started);
  }

  if (PROHIBITED_ACTION_PATTERNS.some((pattern) => pattern.test(message))) {
    return finalize(SYNTHETIC_REFUSAL_TURN(input.turnId), started);
  }

  if (
    lower.includes("search") ||
    lower.includes("directory") ||
    lower.includes("find provider") ||
    lower.includes("public")
  ) {
    const search = searchPublicDirectory(message);
    if (!search.ok && search.deniedPrivate) {
      return finalize(
        SYNTHETIC_PRIVATE_SEARCH_DENIED_TURN(input.turnId),
        started,
      );
    }
    if (search.ok) {
      return finalize(
        SYNTHETIC_PUBLIC_SEARCH_TURN(
          input.turnId,
          search.hits.map((hit) => `${hit.name}: ${hit.summary}`),
        ),
        started,
      );
    }
  }

  // Private-looking queries without explicit search verb still deny retrieval.
  const privateProbe = searchPublicDirectory(message);
  if (!privateProbe.ok && privateProbe.deniedPrivate) {
    return finalize(
      SYNTHETIC_PRIVATE_SEARCH_DENIED_TURN(input.turnId),
      started,
    );
  }

  let candidate: PersonaTurn;
  if (
    lower.includes("draft") ||
    lower.includes("support request") ||
    lower.includes("write a request")
  ) {
    candidate = SYNTHETIC_DRAFT_TURN(input.turnId);
  } else if (
    lower.includes("unknown") ||
    lower.includes("my plan") ||
    lower.includes("my provider") ||
    lower.includes("specific funding")
  ) {
    candidate = SYNTHETIC_UNCERTAIN_TURN(input.turnId);
  } else if (
    lower.includes("mapable") ||
    lower.includes("accessibility") ||
    lower.includes("what can you") ||
    lower.includes("help")
  ) {
    candidate = SYNTHETIC_PUBLIC_INFO_TURN(input.turnId);
  } else {
    candidate = SYNTHETIC_UNCERTAIN_TURN(input.turnId);
  }

  return finalize(candidate, started);
}

function finalize(
  turn: PersonaTurn,
  started: number,
): SyntheticAdapterResult {
  const validated = validatePersonaTurn(turn);
  const latencyMs = Math.max(0, Date.now() - started);
  if (!validated.ok) {
    return { ok: false, reason: "invalid_response", latencyMs };
  }
  // Stage 2 invariant: drafts are never executable sends.
  if (
    validated.turn.editableDraft &&
    validated.turn.editableDraft.executable !== false
  ) {
    return { ok: false, reason: "invalid_response", latencyMs };
  }
  if (validated.turn.actionAuthority !== "none") {
    return { ok: false, reason: "invalid_response", latencyMs };
  }
  return { ok: true, turn: validated.turn, latencyMs };
}

/** Test helper: corrupt a turn to exercise validation failures. */
export function corruptPersonaTurnForTests(turn: PersonaTurn): unknown {
  return { ...turn, actionAuthority: "execute", schemaVersion: "bad" };
}
