import { transitionPersonaState } from "@/lib/virtual-persona/state-machine";
import { generateSyntheticPersonaTurn } from "@/lib/virtual-persona/synthetic-adapter";
import type {
  PersonaConversationState,
  PersonaEditableDraft,
  PersonaHistoryItem,
  PersonaPresentationPrefs,
  PersonaTurn,
} from "@/lib/virtual-persona/types";

export type VirtualPersonaControllerSnapshot = {
  state: PersonaConversationState;
  history: PersonaHistoryItem[];
  draft: PersonaEditableDraft | null;
  prefs: PersonaPresentationPrefs;
  statusMessage: string;
  lastError: string | null;
  pendingTurnId: string | null;
};

export type VirtualPersonaController = {
  getSnapshot: () => VirtualPersonaControllerSnapshot;
  setPrefs: (prefs: Partial<PersonaPresentationPrefs>) => void;
  setComposing: (active: boolean) => void;
  send: (message: string) => Promise<void>;
  stop: () => void;
  clear: () => void;
  retryLast: () => Promise<void>;
  beginDraftEdit: () => void;
  updateDraft: (body: string) => void;
  rejectDraft: () => void;
  useNonAiFallback: () => void;
  /** Abort in-flight synthetic work (client-local). */
  dispose: () => void;
};

function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_PREFS: PersonaPresentationPrefs = {
  readingComplexity: "plain",
  responseLength: "short",
  useAiAssistance: true,
};

/**
 * Deterministic client controller for P02 synthetic persona.
 * Does not grant permissions, call live models, or write consent.
 */
export function createVirtualPersonaController(
  initial?: Partial<VirtualPersonaControllerSnapshot>,
): VirtualPersonaController {
  let state: PersonaConversationState = initial?.state ?? "idle";
  let history: PersonaHistoryItem[] = initial?.history ? [...initial.history] : [];
  let draft: PersonaEditableDraft | null = initial?.draft ?? null;
  let prefs: PersonaPresentationPrefs = {
    ...DEFAULT_PREFS,
    ...initial?.prefs,
  };
  let statusMessage =
    initial?.statusMessage ??
    "Ready. This persona is AI-assisted demo text and may make mistakes.";
  let lastError: string | null = initial?.lastError ?? null;
  let pendingTurnId: string | null = null;
  let lastParticipantMessage: string | null = null;
  let aborted = false;
  let generation = 0;

  const setState = (next: PersonaConversationState) => {
    state = transitionPersonaState(state, next);
  };

  const push = (item: PersonaHistoryItem) => {
    history = [...history, item];
  };

  const controller: VirtualPersonaController = {
    getSnapshot: () => ({
      state,
      history: [...history],
      draft,
      prefs: { ...prefs },
      statusMessage,
      lastError,
      pendingTurnId,
    }),

    setPrefs: (partial) => {
      prefs = { ...prefs, ...partial };
    },

    setComposing: (active) => {
      if (active && (state === "idle" || state === "response_ready" || state === "stopped")) {
        setState("composing");
        statusMessage = "Composing. Take the time you need—there is no timer.";
      }
      if (!active && state === "composing") {
        setState("idle");
      }
    },

    send: async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) {
        lastError = "Enter a message before sending.";
        statusMessage = lastError;
        return;
      }

      if (!prefs.useAiAssistance) {
        controller.useNonAiFallback();
        return;
      }

      aborted = false;
      const turnId = newId("turn");
      pendingTurnId = turnId;
      lastParticipantMessage = trimmed;
      lastError = null;
      generation += 1;
      const currentGeneration = generation;

      push({
        id: newId("msg"),
        speaker: "participant",
        text: trimmed,
        createdAt: new Date().toISOString(),
      });

      setState("processing");
      statusMessage = "Preparing a synthetic reply. You can stop at any time.";

      const result = await generateSyntheticPersonaTurn({
        turnId,
        message: trimmed,
        useAiAssistance: prefs.useAiAssistance,
      });

      if (aborted || currentGeneration !== generation) {
        return;
      }

      if (!result.ok) {
        setState("error");
        lastError =
          result.reason === "invalid_response"
            ? "The response failed safety validation and was not shown."
            : "The synthetic adapter is unavailable.";
        statusMessage = lastError;
        pendingTurnId = null;
        return;
      }

      applyTurn(result.turn);
    },

    stop: () => {
      aborted = true;
      generation += 1;
      pendingTurnId = null;
      setState("stopped");
      statusMessage =
        "Stopped. Your draft is kept. Local stop cancels this browser request only—it does not revoke server credentials.";
      push({
        id: newId("msg"),
        speaker: "system",
        text: "Interaction stopped by you.",
        createdAt: new Date().toISOString(),
      });
    },

    clear: () => {
      aborted = true;
      generation += 1;
      history = [];
      draft = null;
      pendingTurnId = null;
      lastError = null;
      lastParticipantMessage = null;
      setState("idle");
      statusMessage = "Conversation cleared. Nothing was sent to providers.";
    },

    retryLast: async () => {
      if (!lastParticipantMessage) {
        lastError = "Nothing to retry yet.";
        statusMessage = lastError;
        return;
      }
      await controller.send(lastParticipantMessage);
    },

    beginDraftEdit: () => {
      if (!draft) return;
      setState("draft_editing");
      statusMessage = "Edit the draft. It will not send or book anything.";
    },

    updateDraft: (body: string) => {
      if (!draft) return;
      draft = { ...draft, body, executable: false };
    },

    rejectDraft: () => {
      draft = null;
      setState("response_ready");
      statusMessage = "Draft rejected. No action was taken.";
      push({
        id: newId("msg"),
        speaker: "system",
        text: "You rejected the draft. That is fine—nothing proceeded.",
        createdAt: new Date().toISOString(),
      });
    },

    useNonAiFallback: () => {
      aborted = true;
      generation += 1;
      pendingTurnId = null;
      setState("fallback_available");
      statusMessage =
        "Non-AI path: use MapAble search, support pages, or ask a human. This persona will not decide for you.";
      const turnId = newId("turn");
      void generateSyntheticPersonaTurn({
        turnId,
        message: "fallback",
        useAiAssistance: false,
      }).then((result) => {
        if (result.ok) {
          applyTurn(result.turn, true);
        }
      });
    },

    dispose: () => {
      aborted = true;
      generation += 1;
    },
  };

  function applyTurn(turn: PersonaTurn, fromFallback = false) {
    if (turn.actionAuthority !== "none") {
      setState("error");
      lastError = "Refused unsafe actionAuthority.";
      statusMessage = lastError;
      pendingTurnId = null;
      return;
    }

    push({
      id: newId("msg"),
      speaker: "persona",
      text: turn.displayText,
      turn,
      createdAt: new Date().toISOString(),
    });

    draft = turn.editableDraft;
    pendingTurnId = null;
    lastError = null;

    if (fromFallback || turn.responseType === "fallback") {
      setState("fallback_available");
      statusMessage = "Non-AI fallback is available.";
      return;
    }
    if (turn.responseType === "clarification") {
      setState("needs_clarification");
      statusMessage = "Clarification needed. Reply when you are ready.";
      return;
    }
    if (turn.editableDraft) {
      setState("response_ready");
      statusMessage = "Draft ready to review or reject.";
      return;
    }
    setState("response_ready");
    statusMessage = "Response ready. You remain in control.";
  }

  return controller;
}
