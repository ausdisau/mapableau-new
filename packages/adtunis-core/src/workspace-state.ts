import { AdtunisActionError } from "./errors";
import type {
  AdtunisWorkspace,
  Recognition,
  WorkspaceAction,
} from "./schemas";
import { workspaceSchema } from "./schemas";

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

export function seedWorkspace(
  overrides: Partial<AdtunisWorkspace> = {},
): AdtunisWorkspace {
  return workspaceSchema.parse({
    demo: true,
    participantName: "Your workspace",
    consent: {
      transcription: false,
      personalisation: false,
      research: false,
    },
    audioRetention: "process-only",
    accessibility: {
      fontScale: 1,
      highContrast: false,
      reducedMotion: false,
      switchNavigation: false,
    },
    captureState: "idle",
    message:
      "Compose with speech, typing or AAC. Nothing is sent until you confirm.",
    recognitions: [],
    corrections: [],
    activity: [],
    lastDelivery: null,
    ...overrides,
  });
}

/** Test fixture with a sample recognition and optional personalised context. */
export function seedWorkspaceWithRecognition(): AdtunisWorkspace {
  const state = seedWorkspace();
  state.recognitions = [
    {
      id: "recognition-1",
      raw: "Can we meet in the garden",
      alternatives: ["Can we meet in the garden?"],
      confidence: 0.72,
      uncertainty: "moderate",
      confirmed: null,
      createdAt: now(),
    },
  ];
  return state;
}

function activity(
  state: AdtunisWorkspace,
  title: string,
  detail: string,
  type: string,
) {
  state.message = detail;
  state.activity.unshift({
    id: id(),
    title,
    detail,
    type,
    createdAt: now(),
  });
  state.activity = state.activity.slice(0, 40);
}

function requiredText(action: WorkspaceAction): string {
  if (!action.text?.trim()) {
    throw new AdtunisActionError(
      "Enter or select the expression you want to confirm.",
    );
  }
  return action.text.trim();
}

export function applyAction(
  state: AdtunisWorkspace,
  action: WorkspaceAction,
  options: { retentionAvailable?: boolean } = {},
): AdtunisWorkspace {
  const recognition = state.recognitions.find((item) => item.id === action.id);

  switch (action.type) {
    case "startCapture":
      if (!state.consent.transcription) {
        throw new AdtunisActionError(
          "Enable transcription consent before starting capture.",
          403,
        );
      }
      state.captureState = "capturing";
      state.message =
        "Capture is active. Audio stays on this device until you submit it for recognition.";
      break;
    case "stopCapture":
      if (state.captureState !== "capturing") {
        throw new AdtunisActionError("Start capture first.");
      }
      state.captureState = "stopped";
      state.message =
        "Capture stopped. Review your audio retention choice before recognition.";
      break;
    case "ingestRecognition": {
      if (!state.consent.transcription) {
        throw new AdtunisActionError("Transcription consent is required.", 403);
      }
      if (!action.recognition) {
        throw new AdtunisActionError("Recognition payload is required.");
      }
      const item: Recognition = {
        ...action.recognition,
        confirmed: null,
      };
      state.recognitions.unshift(item);
      state.captureState = "idle";
      activity(
        state,
        "Recognition ready",
        "An immutable raw candidate is ready for your review. Nothing has been sent.",
        "speech",
      );
      break;
    }
    case "confirmExpression":
    case "addCorrection": {
      const text = requiredText(action);
      if (action.type === "confirmExpression" && !action.id) {
        state.recognitions.unshift({
          id: id(),
          raw: "",
          alternatives: [],
          confidence: null,
          uncertainty: "unknown",
          confirmed: text,
          createdAt: now(),
        });
        activity(
          state,
          "Text expression confirmed",
          "Your typed or AAC expression was saved. No recognition or microphone was required.",
          "speech",
        );
        break;
      }
      if (!recognition) {
        throw new AdtunisActionError("Recognition not found.", 404);
      }
      if (action.type === "confirmExpression") {
        recognition.confirmed = text;
        activity(
          state,
          "Expression confirmed",
          "Your selected expression was saved separately. The raw candidate is unchanged.",
          "speech",
        );
      } else {
        state.corrections.unshift({
          id: id(),
          recognitionId: recognition.id,
          original: recognition.raw,
          expression: text,
          createdAt: now(),
          trainingStatus: "available",
        });
        activity(
          state,
          "Correction saved",
          "A training example was saved. No training was started.",
          "correction",
        );
      }
      break;
    }
    case "deleteCorrection":
      if (!state.corrections.some((item) => item.id === action.id)) {
        throw new AdtunisActionError("Example not found.", 404);
      }
      state.corrections = state.corrections.filter(
        (item) => item.id !== action.id,
      );
      state.message = "Example deleted. Existing models are not retrained.";
      break;
    case "saveConsent":
      if (!action.consent) {
        throw new AdtunisActionError("All three consent choices are required.");
      }
      state.consent = action.consent;
      if (!state.consent.transcription) state.captureState = "idle";
      activity(
        state,
        "Consent preferences saved",
        "Transcription, personalisation and research are independent choices. Withdrawal does not erase saved data.",
        "privacy",
      );
      break;
    case "saveAudioRetention":
      if (!action.audioRetention) {
        throw new AdtunisActionError("Choose an audio retention option.");
      }
      if (
        action.audioRetention === "retain-privately" &&
        !options.retentionAvailable
      ) {
        throw new AdtunisActionError(
          "Private audio retention is not approved or configured for this deployment.",
          403,
        );
      }
      state.audioRetention = action.audioRetention;
      if (state.audioRetention === "process-only") {
        for (const item of state.recognitions) {
          item.audioObjectPath = null;
          item.audioExpiresAt = null;
        }
      }
      activity(
        state,
        "Audio retention choice saved",
        state.audioRetention === "process-only"
          ? "Audio is processed in memory and not saved after recognition."
          : "Audio will be kept in private storage only until the approved expiry date.",
        "privacy",
      );
      break;
    case "saveAccessibility":
      if (
        !action.accessibility ||
        action.accessibility.fontScale < 1 ||
        action.accessibility.fontScale > 2
      ) {
        throw new AdtunisActionError("Choose a font scale between 1 and 2.");
      }
      state.accessibility = action.accessibility;
      state.message = "Accessibility preferences saved.";
      break;
    case "deleteData": {
      const clean = seedWorkspace();
      clean.accessibility = state.accessibility;
      clean.message =
        "All participant Adtunis data deleted. Accessibility preferences remain.";
      return clean;
    }
    default: {
      const exhaustive: never = action.type;
      throw new AdtunisActionError(`Unsupported action: ${String(exhaustive)}`);
    }
  }

  return workspaceSchema.parse(state);
}

export function recordDelivery(
  state: AdtunisWorkspace,
  delivery: NonNullable<AdtunisWorkspace["lastDelivery"]>,
): AdtunisWorkspace {
  state.lastDelivery = delivery;
  activity(
    state,
    delivery.mode === "mock" ? "Simulated delivery" : "Message delivered",
    delivery.label,
    "delivery",
  );
  return workspaceSchema.parse(state);
}
